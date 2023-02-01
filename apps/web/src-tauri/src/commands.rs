use sdk::{
    detect::{self, Config},
    types::{MailBox, Message, Preview},
};

use crate::{
    cryptography,
    login::try_login,
    parse::{self, parse_sdk_error},
    types::{
        credentials::{self, get_incoming_session_from_login_options},
        Credentials, Error, ErrorKind, LoginOptions, Result,
    },
};

use futures::future::join_all;

use crate::{base64, files::CacheFile};

use tauri::{async_runtime::spawn_blocking, State};

#[tauri::command(async)]
pub async fn detect_config(email_address: String) -> Result<Config> {
    let blocking_task =
        spawn_blocking(move || detect::from_email(&email_address).map_err(parse_sdk_error));

    blocking_task.await.unwrap()
}

#[tauri::command(async)]
pub async fn login(options: Vec<LoginOptions>, sessions: State<'_, Credentials>) -> Result<String> {
    if options.len() < 1 {
        return Err(Error::new(
            ErrorKind::InvalidInput,
            "No credentials provided",
        ));
    }

    // Try to get a session for all of the given login options
    let mut login_threads = Vec::new();

    for option in options.clone() {
        let login_thread = spawn_blocking(move || try_login(&option));

        login_threads.push(login_thread);
    }

    let login_results = join_all(login_threads).await;

    for result in login_results {
        match result.unwrap() {
            Ok(_) => {}
            Err(err) => return Err(err),
        }
    }

    let generate_token = spawn_blocking(move || {
        // Serialize the given options to json
        let options_json = parse::to_json(&options)?;

        // Generate a key and nonce to sign the options
        let key = cryptography::generate_key();
        let nonce = cryptography::generate_nonce();

        // Crypographically sign the login options.
        let encrypted = cryptography::encrypt(&options_json, &key, &nonce)?;

        // Convert the key and nonce to base64
        let nonce_base64 = base64::encode(&nonce);
        let key_base64 = base64::encode(&key);

        let cache = CacheFile::from_session_name(&nonce_base64);

        // Write to file cache so the credentials are still available when the program restarts.
        cache.write(&encrypted)?;

        Ok((nonce_base64, key_base64, encrypted))
    });

    let (nonce_base64, key_base64, encrypted) = generate_token.await.unwrap()?;

    // Get a mutable lock on the sessions
    let mut sessions_lock = sessions.map().lock().unwrap();

    // Insert the encrypted options into memory using the nonce as an identifier so we can retrieve it later.
    sessions_lock.insert(nonce_base64.clone(), encrypted);

    let token = format!("{}:{}", nonce_base64, key_base64);

    // Return the key and nonce to the frontend so it can verify its session later.
    Ok(token)
}

#[tauri::command(async)]
/// Gets a list of all of the mail boxes in the currently logged in account.
pub async fn list(token: String, sessions: State<'_, Credentials>) -> Result<Vec<MailBox>> {
    let login_options = sessions.get_login_options(token)?;

    let fetch_box_list = spawn_blocking(move || {
        let mut session = get_incoming_session_from_login_options(login_options)?;

        let list = session.box_list().map_err(parse_sdk_error);

        session.logout().map_err(parse_sdk_error)?;

        list
    });

    fetch_box_list.await.unwrap()
}

#[tauri::command(async)]
/// Gets a mailbox by its box id.
pub async fn get(
    token: String,
    box_id: String,
    sessions: State<'_, Credentials>,
) -> Result<MailBox> {
    let login_options = sessions.get_login_options(token)?;

    let fetch_box = spawn_blocking(move || {
        let mut session = get_incoming_session_from_login_options(login_options)?;

        let mailbox = session.get(&box_id).map_err(parse_sdk_error);

        session.logout().map_err(parse_sdk_error)?;

        mailbox
    });

    fetch_box.await.unwrap()
}

#[tauri::command(async)]
/// Gets a list of 'previews' from a mailbox. This preview contains some basic data about a message such as the subject and the sender.
pub async fn messages(
    token: String,
    box_id: String,
    start: u32,
    end: u32,
    sessions: State<'_, Credentials>,
) -> Result<Vec<Preview>> {
    let login_options = sessions.get_login_options(token)?;

    let fetch_message_list = spawn_blocking(move || {
        let mut session = get_incoming_session_from_login_options(login_options)?;

        let message_list = session
            .messages(&box_id, start, end)
            .map_err(parse_sdk_error);

        session.logout().map_err(parse_sdk_error)?;

        message_list
    });

    fetch_message_list.await.unwrap()
}

#[tauri::command(async)]
/// Gets the full message data from a given mailbox and a given message id.
pub async fn get_message(
    token: String,
    box_id: String,
    message_id: String,
    sessions: State<'_, Credentials>,
) -> Result<Message> {
    let login_options = sessions.get_login_options(token)?;

    let fetch_message = spawn_blocking(move || {
        let mut session = get_incoming_session_from_login_options(login_options)?;

        let message = session
            .get_message(&box_id, &message_id)
            .map_err(parse_sdk_error);

        session.logout().map_err(parse_sdk_error)?;

        message
    });

    fetch_message.await.unwrap()
}

#[tauri::command]
/// Log out of the currently logged in account.
pub fn logout(token: String, sessions: State<'_, Credentials>) -> Result<()> {
    let (_, nonce) = credentials::get_nonce_and_key_from_token(&token)?;

    let cache = CacheFile::from_session_name(nonce);

    cache.delete()?;

    Ok(())
}

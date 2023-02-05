use sdk::{
    detect::{self, Config},
    types::{MailBox, Message, Preview},
};

use crate::{
    base64, cryptography,
    files::CacheFile,
    parse::{self, parse_sdk_error},
    types::{session, ClientType, Error, ErrorKind, LoginOptions, Result, Sessions},
};

use futures::future::join_all;

use tauri::{async_runtime::spawn_blocking, State};

#[tauri::command(async)]
pub async fn detect_config(email_address: String) -> Result<Config> {
    detect::from_email(&email_address)
        .await
        .map_err(parse_sdk_error)
}

#[tauri::command(async)]
pub async fn login(options: Vec<LoginOptions>, sessions: State<'_, Sessions>) -> Result<String> {
    if options.len() < 1 {
        return Err(Error::new(
            ErrorKind::InvalidInput,
            "No credentials provided",
        ));
    }

    if options
        .iter()
        .filter(|login_config| match login_config.client_type() {
            ClientType::Incoming(_) => true,
            ClientType::Outgoing(_) => false,
        })
        .count()
        > 1
    {
        return Err(Error::new(
            ErrorKind::InvalidInput,
            "Cannot login to multiple incoming servers at the same time.",
        ));
    }

    if options
        .iter()
        .filter(|login_config| match login_config.client_type() {
            ClientType::Incoming(_) => false,
            ClientType::Outgoing(_) => true,
        })
        .count()
        > 1
    {
        return Err(Error::new(
            ErrorKind::InvalidInput,
            "Cannot login to multiple outgoing servers at the same time.",
        ));
    }

    // Try to get a session for all of the given login options
    let mut login_threads = Vec::new();

    for option in options.clone() {
        let login_thread =
            spawn_blocking(move || session::get_incoming_session_from_login_options(&option));

        login_threads.push(login_thread);
    }

    let login_results = join_all(login_threads).await;

    let new_sessions = login_results
        .into_iter()
        .map(|result| result.unwrap())
        .fold(Ok(Vec::new()), |result, session_result| {
            result.and_then(|mut result_vec| {
                session_result.map(|session| {
                    result_vec.push(session);
                    result_vec
                })
            })
        })?;

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

        let token = format!("{}:{}", nonce_base64, key_base64);

        Ok(token)
    });

    let token = generate_token.await.unwrap()?;

    for session in new_sessions {
        match session {
            Some(session) => {
                sessions.insert_session(&token, session)?;
            }
            None => {}
        }
    }

    // Return the key and nonce to the frontend so it can verify its session later.
    Ok(token)
}

#[tauri::command(async)]
/// Gets a list of all of the mail boxes in the currently logged in account.
pub async fn list(token: String, sessions: State<'_, Sessions>) -> Result<Vec<MailBox>> {
    let session = sessions.get_incoming_session(&token)?;

    let fetch_box_list = spawn_blocking(move || {
        let mut session_lock = session.lock().unwrap();

        let list = session_lock
            .box_list()
            .map_err(parse_sdk_error)
            .map(|box_list| box_list.clone());

        list
    });

    fetch_box_list.await.unwrap()
}

#[tauri::command(async)]
/// Gets a mailbox by its box id.
pub async fn get(token: String, box_id: String, sessions: State<'_, Sessions>) -> Result<MailBox> {
    let session = sessions.get_incoming_session(&token)?;

    let fetch_box = spawn_blocking(move || {
        let mut session_lock = session.lock().unwrap();

        let mailbox = session_lock
            .get(&box_id)
            .map_err(parse_sdk_error)
            .map(|mailbox| mailbox.clone());

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
    sessions: State<'_, Sessions>,
) -> Result<Vec<Preview>> {
    let session = sessions.get_incoming_session(&token)?;

    let fetch_message_list = spawn_blocking(move || {
        let mut session_lock = session.lock().unwrap();

        let message_list = session_lock
            .messages(&box_id, start, end)
            .map_err(parse_sdk_error);

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
    sessions: State<'_, Sessions>,
) -> Result<Message> {
    let session = sessions.get_incoming_session(&token)?;

    let fetch_message = spawn_blocking(move || {
        let mut session_lock = session.lock().unwrap();

        let message = session_lock
            .get_message(&box_id, &message_id)
            .map_err(parse_sdk_error);

        message
    });

    fetch_message.await.unwrap()
}

#[tauri::command(async)]
/// Log out of the currently logged in account.
pub async fn logout(token: String, sessions: State<'_, Sessions>) -> Result<()> {
    let session = sessions.get_incoming_session(&token)?;

    let logout = spawn_blocking(move || {
        let mut session_lock = session.lock().unwrap();

        session_lock.logout().map_err(parse_sdk_error)?;

        let (_, nonce) = session::get_nonce_and_key_from_token(&token)?;

        let cache = CacheFile::from_session_name(nonce);

        cache.delete()?;

        Ok(())
    });

    logout.await.unwrap()
}

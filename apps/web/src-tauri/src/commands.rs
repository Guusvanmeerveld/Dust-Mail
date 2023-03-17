use sdk::{
    detect::{self, Config},
    session::FullLoginOptions,
    types::{MailBox, Message, Preview},
};

use crate::{
    files::CacheFile,
    types::{session, Result, Sessions},
};

use tauri::{async_runtime::spawn_blocking, State};

#[tauri::command(async)]
pub async fn detect_config(email_address: String) -> Result<Config> {
    Ok(detect::from_email(&email_address).await?)
}

#[tauri::command(async)]
pub async fn login(
    credentials: FullLoginOptions,
    session_handler: State<'_, Sessions>,
) -> Result<String> {
    // Connect and login to the mail servers using the user provided credentials.
    let mail_sessions = sdk::session::create_sessions(&credentials).await?;

    let generate_token = spawn_blocking(move || session::generate_token(&credentials));

    let token: String = generate_token.await.unwrap()?;

    session_handler.insert_session(&token, mail_sessions)?;

    // Return the key and nonce to the frontend so it can verify its session later.
    Ok(token)
}

#[tauri::command(async)]
/// Gets a list of all of the mail boxes in the currently logged in account.
pub async fn list(token: String, sessions: State<'_, Sessions>) -> Result<Vec<MailBox>> {
    let session = sessions.get_incoming_session(&token).await?;

    let fetch_box_list = spawn_blocking(move || {
        let mut session_lock = session.lock().unwrap();

        let list = session_lock.box_list().map(|box_list| box_list.clone())?;

        Ok(list)
    });

    fetch_box_list.await.unwrap()
}

#[tauri::command(async)]
/// Gets a mailbox by its box id.
pub async fn get(token: String, box_id: String, sessions: State<'_, Sessions>) -> Result<MailBox> {
    let session = sessions.get_incoming_session(&token).await?;

    let fetch_box = spawn_blocking(move || {
        let mut session_lock = session.lock().unwrap();

        let mailbox = session_lock.get(&box_id).map(|mailbox| mailbox.clone())?;

        Ok(mailbox)
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
    let session = sessions.get_incoming_session(&token).await?;

    let fetch_message_list = spawn_blocking(move || {
        let mut session_lock = session.lock().unwrap();

        let message_list = session_lock.messages(&box_id, start, end)?;

        Ok(message_list)
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
    let session = sessions.get_incoming_session(&token).await?;

    let fetch_message = spawn_blocking(move || {
        let mut session_lock = session.lock().unwrap();

        let message = session_lock.get_message(&box_id, &message_id)?;

        Ok(message)
    });

    fetch_message.await.unwrap()
}

#[tauri::command(async)]
/// Log out of the currently logged in account.
pub async fn logout(token: String, sessions: State<'_, Sessions>) -> Result<()> {
    let session = sessions.get_incoming_session(&token).await?;

    let logout = spawn_blocking(move || {
        let mut session_lock = session.lock().unwrap();

        session_lock.logout()?;

        let (_, nonce) = session::get_nonce_and_key_from_token(&token)?;

        let cache = CacheFile::from_session_name(nonce);

        cache.delete()?;

        Ok(())
    });

    logout.await.unwrap()
}

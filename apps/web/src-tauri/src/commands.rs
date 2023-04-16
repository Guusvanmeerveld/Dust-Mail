use sdk::{
    detect::{self, Config},
    session::FullLoginOptions,
    types::{MailBox, Message, Preview},
};

use crate::{identifier::Identifier, keyring, parse::to_json, sessions::Sessions, types::Result};

use tauri::State;

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

    let mut identifier = Identifier::from(&credentials);

    identifier.hash()?;

    let identifier: String = identifier.into();

    let credentials_json = to_json(&credentials)?;

    keyring::set(&identifier, credentials_json)?;

    session_handler.insert_session(&identifier, mail_sessions)?;

    // Return the key and nonce to the frontend so it can verify its session later.
    Ok(identifier)
}

#[tauri::command(async)]
/// Gets a list of all of the mail boxes in the currently logged in account.
pub async fn list(token: String, sessions: State<'_, Sessions>) -> Result<Vec<MailBox>> {
    let session = sessions.get_incoming_session(&token).await?;

    let mut session_lock = session.lock().await;

    let list = session_lock
        .box_list()
        .await
        .map(|box_list| box_list.clone())?;

    Ok(list)
}

#[tauri::command(async)]
/// Gets a mailbox by its box id.
pub async fn get(token: String, box_id: String, sessions: State<'_, Sessions>) -> Result<MailBox> {
    let session = sessions.get_incoming_session(&token).await?;

    let mut session_lock = session.lock().await;

    let mailbox = session_lock
        .get(&box_id)
        .await
        .map(|mailbox| mailbox.clone())?;

    Ok(mailbox)
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

    let mut session_lock = session.lock().await;

    let message_list = session_lock.messages(&box_id, start, end).await?;

    Ok(message_list)
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

    let mut session_lock = session.lock().await;

    let message = session_lock.get_message(&box_id, &message_id).await?;

    Ok(message)
}

#[tauri::command(async)]
/// Log out of the currently logged in account.
pub async fn logout(identifier: String, sessions: State<'_, Sessions>) -> Result<()> {
    let session = sessions.get_incoming_session(&identifier).await?;

    let mut session_lock = session.lock().await;

    session_lock.logout().await?;

    Ok(())
}

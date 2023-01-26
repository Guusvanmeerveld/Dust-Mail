use sdk::{
    detect::{self, Config},
    types::{ConnectionSecurity, LoginOptions as ClientLoginOptions, MailBox},
    IncomingClientConstructor,
};

use crate::{
    cryptography,
    parse::{self, parse_sdk_error},
    types::{ClientType, Error, ErrorKind, LoginOptions, Result, Sessions},
};

use crate::base64;

use tauri::State;

#[tauri::command]
pub fn detect_config(email_address: &str) -> Result<Config> {
    detect::from_email(email_address).map_err(parse_sdk_error)
}

#[tauri::command]
pub fn login(options: Vec<LoginOptions>, sessions: State<'_, Sessions>) -> Result<String> {
    if options.len() < 1 {
        return Err(Error::new(
            ErrorKind::InvalidInput,
            "No credentials provided",
        ));
    }

    // Try to get a session for all of the given login options
    for option in &options {
        match option.client_type() {
            ClientType::Incoming(client_type) => {
                let options = ClientLoginOptions::new(option.server(), option.port());

                let mut session = match option.security() {
                    ConnectionSecurity::Tls => {
                        let client = IncomingClientConstructor::new(client_type, Some(options))
                            .map_err(parse_sdk_error)?;

                        client
                            .login(option.username(), option.password())
                            .map_err(parse_sdk_error)?
                    }
                    ConnectionSecurity::Plain => {
                        let client =
                            IncomingClientConstructor::new_plain(client_type, Some(options))
                                .map_err(parse_sdk_error)?;

                        client
                            .login(option.username(), option.password())
                            .map_err(parse_sdk_error)?
                    }
                    _ => {
                        todo!()
                    }
                };

                session.logout().map_err(parse_sdk_error)?;
            }
        };
    }

    // Serialize the given options to json
    let options_json = parse::to_json(&options)?;

    // Generate a key and nonce to sign the options
    let key = cryptography::generate_key();
    let nonce = cryptography::generate_nonce();

    // Crypographically sign the login options.
    let encrypted = cryptography::encrypt(options_json.as_bytes(), &key, &nonce)?;

    // Convert the key and nonce to base64
    let nonce_base64 = base64::encode(&nonce);
    let key_base64 = base64::encode(&key);

    // Get a mutable lock on the sessions
    let mut sessions_lock = sessions.0.lock().unwrap();

    // Insert the encrypted options into memory using the nonce as an identifier so we can retrieve it later.
    sessions_lock.insert(nonce_base64.clone(), encrypted);

    // Return the key and nonce to the frontend so it can verify its session later.
    Ok(format!("{}:{}", nonce_base64, key_base64))
}

#[tauri::command]
/// Gets a list of all of the mail boxes in the currently logged in account.
pub fn list(token: String, sessions: State<'_, Sessions>) -> Result<Vec<MailBox>> {
    let mut session = sessions.get_incoming_session(&token)?;

    let list = session.box_list().map_err(parse_sdk_error)?;

    session.logout().map_err(parse_sdk_error)?;

    Ok(list)
}

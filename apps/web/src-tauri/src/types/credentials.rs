use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::Instant,
};

use sdk::{
    types::{ConnectionSecurity, LoginOptions as ClientLoginOptions},
    IncomingClientConstructor, IncomingSession,
};

use serde_json;

use crate::{
    files::CacheFile,
    parse::parse_sdk_error,
    types::{Error, ErrorKind, Result},
};

use crate::{base64, cryptography};

use super::{ClientType, LoginOptions};

pub fn get_incoming_session_from_login_options(
    options: Vec<LoginOptions>,
) -> Result<Box<dyn IncomingSession>> {
    for option in &options {
        match option.client_type() {
            ClientType::Incoming(client_type) => {
                let options = ClientLoginOptions::new(option.domain(), option.port());

                match option.security() {
                    ConnectionSecurity::Tls => {
                        let client = IncomingClientConstructor::new(client_type, Some(options))
                            .map_err(parse_sdk_error)?;

                        return client
                            .login(option.username(), option.password())
                            .map_err(parse_sdk_error);
                    }
                    ConnectionSecurity::Plain => {
                        let client =
                            IncomingClientConstructor::new_plain(client_type, Some(options))
                                .map_err(parse_sdk_error)?;

                        return client
                            .login(option.username(), option.password())
                            .map_err(parse_sdk_error);
                    }
                    _ => {
                        todo!()
                    }
                }
            }
            _ => {}
        }
    }

    Err(Error::new(
        ErrorKind::NotLoggedIn,
        "Could not find credentials for an incoming client",
    ))
}

pub fn get_nonce_and_key_from_token(token: &str) -> Result<(String, String)> {
    let mut split = token.split(':');

    let nonce_base64 = match split.next() {
        Some(key) => key.to_string(),
        None => {
            return Err(Error::new(
                ErrorKind::InvalidToken,
                "Token is missing a nonce",
            ))
        }
    };

    let key_base64 = match split.next() {
        Some(key) => key.to_string(),
        None => {
            return Err(Error::new(
                ErrorKind::InvalidToken,
                "Token is missing a key",
            ))
        }
    };

    Ok((key_base64, nonce_base64))
}

#[derive(Default)]
/// A thread-safe map containing all of the encrypted login data.
pub struct Credentials(Arc<Mutex<HashMap<String, Vec<u8>>>>);

impl Credentials {
    pub fn new() -> Self {
        Self(Default::default())
    }

    pub fn map(&self) -> &Arc<Mutex<HashMap<String, Vec<u8>>>> {
        &self.0
    }

    /// Get the incoming session from a given token.
    pub fn get_login_options(&self, token: String) -> Result<Vec<LoginOptions>> {
        let (key_base64, nonce_base64) = get_nonce_and_key_from_token(&token)?;

        let key = base64::decode(key_base64.as_bytes())?;
        let nonce = base64::decode(nonce_base64.as_bytes())?;

        let sessions_lock = self.0.lock().unwrap();

        let mut encrypted: &Vec<u8> = Vec::new().as_ref();
        let mut encrypted_file_data = Vec::new();

        match sessions_lock.get(&nonce_base64) {
            Some(bytes) => encrypted = bytes,
            None => {
                // TODO: Read session token from file if we failed to get it from memory
                let cache = CacheFile::from_session_name(nonce_base64);

                match cache.read(&mut encrypted_file_data) {
                    Ok(_) => {
                        encrypted = &encrypted_file_data;
                    }
                    Err(_) => {
                        return Err(Error::new(
                            ErrorKind::NotLoggedIn,
                            "Could not find login credentials, please login",
                        ));
                    }
                }
            }
        };

        let decrypted = cryptography::decrypt(encrypted, &key, &nonce)?;

        let login_options: Vec<LoginOptions> = serde_json::from_slice(&decrypted).map_err(|e| {
            Error::new(
                ErrorKind::DeserializeJSON,
                format!("Could not deserialize encrypted login info {}", e),
            )
        })?;

        Ok(login_options)
    }
}

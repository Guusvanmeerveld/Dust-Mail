use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use sdk::{
    types::{ConnectionSecurity, LoginOptions as ClientLoginOptions},
    IncomingClientConstructor, IncomingSession,
};

use serde_json;

use crate::{
    parse::parse_sdk_error,
    types::{Error, ErrorKind, Result},
};

use crate::{base64, cryptography};

use super::{ClientType, LoginOptions};

fn get_incoming_session_from_login_options(
    options: Vec<LoginOptions>,
) -> Result<Box<dyn IncomingSession>> {
    for option in &options {
        match option.client_type() {
            ClientType::Incoming(client_type) => {
                let options = ClientLoginOptions::new(option.server(), option.port());

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

#[derive(Default)]
/// A thread-safe map containing all of the encrypted login data.
pub struct Sessions(pub Arc<Mutex<HashMap<String, Vec<u8>>>>);

impl Sessions {
    pub fn new() -> Self {
        Self(Default::default())
    }

    pub fn get_incoming_session(&self, token: &str) -> Result<Box<dyn IncomingSession>> {
        let mut split = token.split(':');

        let nonce_base64 = match split.next() {
            Some(key) => key,
            None => {
                return Err(Error::new(
                    ErrorKind::InvalidToken,
                    "Token is missing a nonce",
                ))
            }
        };

        let key_base64 = match split.next() {
            Some(key) => key,
            None => {
                return Err(Error::new(
                    ErrorKind::InvalidToken,
                    "Token is missing a key",
                ))
            }
        };

        let key = base64::decode(key_base64.as_bytes())?;
        let nonce = base64::decode(nonce_base64.as_bytes())?;

        let sessions_lock = self.0.lock().unwrap();

        let encrypted = match sessions_lock.get(nonce_base64) {
            Some(bytes) => bytes,
            None => {
                return Err(Error::new(
                    ErrorKind::NotLoggedIn,
                    "Could not find session, try logging in",
                ))
            }
        };

        let decrypted = cryptography::decrypt(encrypted, &key, &nonce)?;

        let login_options: Vec<LoginOptions> = serde_json::from_slice(&decrypted).map_err(|e| {
            Error::new(
                ErrorKind::DeserializeJSON,
                format!("Could not deserialize encrypted login info {}", e),
            )
        })?;

        let session = get_incoming_session_from_login_options(login_options)?;

        Ok(session)
    }
}

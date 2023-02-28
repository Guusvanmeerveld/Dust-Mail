mod utils;

use dashmap::DashMap;
pub use utils::get_nonce_and_key_from_token;

use std::sync::{Arc, Mutex};

use sdk::{
    types::{ConnectionSecurity, LoginOptions as ClientLoginOptions},
    IncomingClientConstructor, IncomingSession,
};

use crate::{
    parse::parse_sdk_error,
    types::{Error, ErrorKind, Result},
};

use super::{ClientType, LoginOptions};

pub fn get_incoming_session_from_login_options(
    options: &LoginOptions,
) -> Result<Option<Box<dyn IncomingSession + Send>>> {
    match options.client_type() {
        ClientType::Incoming(client_type) => {
            let client_options = ClientLoginOptions::new(options.domain(), options.port());

            match options.security() {
                ConnectionSecurity::Tls => {
                    let client = IncomingClientConstructor::new(client_type, Some(client_options))
                        .map_err(parse_sdk_error)?;

                    return client
                        .login(options.username(), options.password())
                        .map_err(parse_sdk_error)
                        .map(Some);
                }
                ConnectionSecurity::Plain => {
                    let client =
                        IncomingClientConstructor::new_plain(client_type, Some(client_options))
                            .map_err(parse_sdk_error)?;

                    return client
                        .login(options.username(), options.password())
                        .map_err(parse_sdk_error)
                        .map(Some);
                }
                _ => {
                    todo!()
                }
            }
        }
        _ => Ok(None),
    }
}

type ThreadSafeSession = Arc<Mutex<Box<dyn IncomingSession + Send>>>;

pub struct Sessions(Arc<DashMap<String, ThreadSafeSession>>);

impl Sessions {
    pub fn new() -> Self {
        Self(Arc::new(DashMap::new()))
    }

    pub fn insert_session(
        &self,
        token: &str,
        session: Box<dyn IncomingSession + Send>,
    ) -> Result<()> {
        let (_, nonce_base64) = get_nonce_and_key_from_token(token)?;

        let key = format!("{}-incoming", nonce_base64);

        let thread_safe_session = Arc::new(Mutex::new(session));

        self.0.insert(key, thread_safe_session);

        Ok(())
    }

    pub fn get_incoming_session(&self, token: &str) -> Result<ThreadSafeSession> {
        let (_, nonce_base64) = get_nonce_and_key_from_token(token)?;

        let key = format!("{}-incoming", nonce_base64);

        match self.0.get(&key) {
            // Return the current session
            Some(session) => Ok(session.clone()),
            None => {
                let login_options = utils::get_login_options(token)?;

                for options in login_options {
                    let session = get_incoming_session_from_login_options(&options)?;

                    match session {
                        Some(session) => {
                            self.0.insert(key.clone(), Arc::new(Mutex::new(session)));
                        }
                        None => {}
                    }
                }

                match self.0.get(&key) {
                    Some(session) => Ok(session.clone()),
                    None => Err(Error::new(
                        ErrorKind::NotLoggedIn,
                        "Could not find incoming session",
                    )),
                }
            }
        }
    }
}

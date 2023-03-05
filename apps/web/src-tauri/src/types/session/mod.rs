mod utils;

use dashmap::DashMap;
pub use utils::{generate_token, get_nonce_and_key_from_token};

use std::sync::Arc;

use sdk::session::{MailSessions, create_sessions, ThreadSafeIncomingSession};

use crate::types::{Error, ErrorKind, Result};

pub struct Sessions(DashMap<String, Arc<MailSessions>>);

impl Sessions {
    pub fn new() -> Self {
        Self(DashMap::new())
    }

    pub fn insert_session(&self, token: &str, session: MailSessions) -> Result<()> {
        let (_, nonce_base64) = get_nonce_and_key_from_token(token)?;

        let key = format!("{}-incoming", nonce_base64);

        let thread_safe_session = Arc::new(session);

        self.0.insert(key, thread_safe_session);

        Ok(())
    }

    pub async fn get_incoming_session(&self, token: &str) -> Result<ThreadSafeIncomingSession> {
        let mail_sessions = self.get_sessions(token).await?; 

        Ok(mail_sessions.incoming())
    }

    pub async fn get_sessions(&self, token: &str) -> Result<Arc<MailSessions>> {
        let (_, nonce_base64) = get_nonce_and_key_from_token(token)?;

        let key = format!("{}-incoming", nonce_base64);

        match self.0.get(&key) {
            // Return the current session
            Some(session) => Ok(session.clone()),
            None => {
                let credentials = utils::get_credentials(token)?;

                let mail_sessions = create_sessions(&credentials).await?;

                self.0.insert(key.clone(), Arc::new(mail_sessions));

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

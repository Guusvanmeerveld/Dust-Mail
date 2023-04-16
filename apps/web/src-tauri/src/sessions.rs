use dashmap::DashMap;
use serde_json::from_str;

use std::sync::Arc;

use sdk::session::{MailSessions, ThreadSafeIncomingSession};

use crate::{keyring, types::Result};

pub struct Sessions {
    sessions_map: DashMap<String, Arc<MailSessions>>,
}

impl Sessions {
    pub fn new() -> Self {
        Self {
            sessions_map: DashMap::new(),
        }
    }

    pub fn insert_session<S: Into<String>>(
        &self,
        identifier: S,
        sessions: MailSessions,
    ) -> Result<()> {
        let identifier = identifier.into();

        self.sessions_map.insert(identifier, Arc::new(sessions));

        Ok(())
    }

    pub async fn get_incoming_session<S: AsRef<str>>(
        &self,
        identifier: S,
    ) -> Result<ThreadSafeIncomingSession> {
        let mail_sessions = self.get_session(identifier.as_ref()).await?;

        Ok(mail_sessions.incoming().clone())
    }

    pub async fn get_session<S: Into<String>>(&self, identifier: S) -> Result<Arc<MailSessions>> {
        let identifier = identifier.into();

        match self.sessions_map.get(&identifier) {
            Some(sessions) => Ok(sessions.clone()),
            None => {
                // If we don't have a session stored, we try to get it from the credentials stored in the keyring.
                let credentials_json = keyring::get(&identifier)?;

                let credentials = from_str(&credentials_json)?;

                let mail_sessions = sdk::session::create_sessions(&credentials).await?;

                self.insert_session(identifier.clone(), mail_sessions)?;

                match self.sessions_map.get(&identifier) {
                    Some(sessions) => Ok(sessions.clone()),
                    None => unreachable!(),
                }
            }
        }
    }
}

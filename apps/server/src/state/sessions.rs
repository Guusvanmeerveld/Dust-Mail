use std::sync::Arc;

use dashmap::DashMap;
use sdk::session::{MailSessions, ThreadSafeIncomingSession};

use crate::types::{Error, ErrorKind, Result};

pub struct GlobalUserSessions {
    sessions: DashMap<String, Arc<UserSession>>,
}

impl GlobalUserSessions {
    pub fn new() -> Self {
        Self {
            sessions: DashMap::new(),
        }
    }

    pub fn get<S: AsRef<str>>(&self, user_token: S) -> Arc<UserSession> {
        match self.sessions.get(user_token.as_ref()) {
            Some(session) => session.clone(),
            None => {
                self.insert(user_token.as_ref());
                self.get(user_token)
            }
        }
    }

    pub fn insert<S: AsRef<str>>(&self, user_token: S) {
        self.sessions.insert(
            String::from(user_token.as_ref()),
            Arc::new(UserSession::new()),
        );
    }

    pub fn remove<S: AsRef<str>>(&self, user_token: S) {
        self.sessions.remove(user_token.as_ref());
    }
}

/// A struct containing all of the users mail sessions.
pub struct UserSession {
    session: DashMap<String, Arc<MailSessions>>,
}

impl UserSession {
    pub fn new() -> Self {
        Self {
            session: DashMap::new(),
        }
    }

    pub fn insert<S: AsRef<str>>(&self, session_token: S, mail_sessions: MailSessions) {
        self.session
            .insert(session_token.as_ref().to_string(), Arc::new(mail_sessions));
    }

    pub fn remove<S: AsRef<str>>(&self, session_token: S) {
        self.session.remove(session_token.as_ref());
    }

    pub fn count(&self) -> usize {
        self.session.iter().count()
    }

    pub fn get<S: AsRef<str>>(&self, session_token: S) -> Option<Arc<MailSessions>> {
        self.session
            .get(session_token.as_ref())
            .map(|sessions| sessions.clone())
    }

    pub fn get_incoming<S: AsRef<str>>(
        &self,
        session_token: S,
    ) -> Result<ThreadSafeIncomingSession> {
        self.session
            .get(session_token.as_ref())
            .map(|mail_sessions| mail_sessions.incoming().clone())
            .ok_or_else(|| {
                Error::new(
                    ErrorKind::BadRequest,
                    "Could not find requested mail session",
                )
            })
    }
}

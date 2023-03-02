use std::sync::{Arc, Mutex, MutexGuard};

use dashmap::{mapref::one::Ref, DashMap};
use sdk::IncomingSession;

type ThreadSafeIncomingMailSession = Arc<Mutex<Box<dyn IncomingSession + Send>>>;

pub struct GlobalUserSessions {
    sessions: DashMap<String, UserSession>,
}

impl GlobalUserSessions {
    pub fn new() -> Self {
        Self {
            sessions: DashMap::new(),
        }
    }

    pub fn insert<S: AsRef<str>>(&self, user_token: S) {
        self.sessions
            .insert(user_token.as_ref().to_string(), UserSession::new());
    }

    pub fn get<S: AsRef<str>>(&self, user_token: S) -> Option<Ref<String, UserSession>> {
        self.sessions.get(user_token.as_ref())
    }

    pub fn remove<S: AsRef<str>>(&self, user_token: S) {
        self.sessions.remove(user_token.as_ref());
    }
}

pub struct UserSession {
    session: DashMap<String, ThreadSafeIncomingMailSession>,
}

impl UserSession {
    pub fn new() -> Self {
        Self {
            session: DashMap::new(),
        }
    }

    pub fn insert<S: AsRef<str>>(
        &self,
        session_token: S,
        mail_session: Box<dyn IncomingSession + Send>,
    ) {
        self.session.insert(
            session_token.as_ref().to_string(),
            Arc::new(Mutex::new(mail_session)),
        );
    }

    pub fn get<S: AsRef<str>>(
        &self,
        session_token: S,
    ) -> Option<Ref<String, ThreadSafeIncomingMailSession>> {
        self.session.get(session_token.as_ref())
    }
}

// pub struct IncomingMailSession {
//     mail_session: ThreadSafeIncomingMailSession,
// }

// impl IncomingMailSession {
//     pub fn new(mail_session: Box<dyn IncomingSession + Send>) -> Self {
//         Self {
//             mail_session: Arc::new(Mutex::new(mail_session)),
//         }
//     }

//     pub fn get<'a>(&'a self) -> MutexGuard<'a, Box<dyn IncomingSession + Send>> {
//         let rw_lock = self.mail_session.lock().unwrap();

//         rw_lock
//     }

// }

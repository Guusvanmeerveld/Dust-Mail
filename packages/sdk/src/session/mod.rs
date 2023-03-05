mod incoming;

use std::sync::{Arc, Mutex};

use serde::{Deserialize, Serialize};
use tokio::task::spawn_blocking;

use crate::{
    types::{IncomingClientType, LoginOptions, Result},
    IncomingSession,
};

pub type ThreadSafeIncomingSession = Arc<Mutex<Box<dyn IncomingSession + Send>>>;

pub struct MailSessions {
    incoming: ThreadSafeIncomingSession,
}

impl MailSessions {
    pub fn new(incoming_session: Box<dyn IncomingSession + Send>) -> Self {
        Self {
            incoming: Arc::new(Mutex::new(incoming_session)),
        }
    }

    pub fn incoming(&self) -> ThreadSafeIncomingSession {
        self.incoming.clone()
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Credentials {
    incoming: LoginOptions,
    incoming_type: IncomingClientType,
}

impl Credentials {
    pub fn incoming_options(&self) -> &LoginOptions {
        &self.incoming
    }

    pub fn incoming_type(&self) -> &IncomingClientType {
        &self.incoming_type
    }

    pub fn new(incoming: (LoginOptions, IncomingClientType)) -> Self {
        Self {
            incoming: incoming.0,
            incoming_type: incoming.1,
        }
    }
}

pub async fn create_sessions(credentials: &Credentials) -> Result<MailSessions> {
    let incoming_credentials = (credentials.incoming_options().clone(), credentials.incoming_type().clone());

    // Try to get a session for all of the given login options
    let incoming_login_thread = spawn_blocking(move || {
        incoming::create_session(&incoming_credentials.0, &incoming_credentials.1)
    });
    // let outgoing_login_thread;

    let incoming_session = incoming_login_thread.await.unwrap()?;

    let mail_sessions = MailSessions::new(incoming_session);

    Ok(mail_sessions)
}

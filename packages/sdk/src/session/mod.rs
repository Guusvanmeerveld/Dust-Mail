mod incoming;
mod login;

use std::sync::{Arc, Mutex};

use crate::{types::Result, IncomingSession};

use self::incoming::create_incoming_session;

pub use self::login::{FullLoginOptions, FullLoginOptionsBuilder};

pub type ThreadSafeIncomingSession = Arc<Mutex<Box<dyn IncomingSession>>>;

pub struct MailSessions {
    incoming: ThreadSafeIncomingSession,
}

impl MailSessions {
    pub fn new(incoming_session: Box<dyn IncomingSession>) -> Self {
        Self {
            incoming: Arc::new(Mutex::new(incoming_session)),
        }
    }

    pub fn incoming(&self) -> &ThreadSafeIncomingSession {
        &self.incoming
    }
}

pub async fn create_sessions(credentials: &FullLoginOptions) -> Result<MailSessions> {
    let incoming_credentials = (
        credentials.incoming_options().clone(),
        credentials.incoming_type().clone(),
    );

    // Try to get a session for all of the given login options
    let incoming_session =
        create_incoming_session(&incoming_credentials.0, &incoming_credentials.1).await?;
    // let outgoing_login_thread;

    let mail_sessions = MailSessions::new(incoming_session);

    Ok(mail_sessions)
}

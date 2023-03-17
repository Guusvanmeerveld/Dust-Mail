mod incoming;
mod login;

use std::sync::{Arc, Mutex};

use tokio::task::spawn_blocking;

use crate::{types::Result, IncomingSession};

use self::incoming::create_incoming_session;

pub use self::login::{FullLoginOptions, FullLoginOptionsBuilder};

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

pub async fn create_sessions(credentials: &FullLoginOptions) -> Result<MailSessions> {
    let incoming_credentials = (
        credentials.incoming_options().clone(),
        credentials.incoming_type().clone(),
    );

    // Try to get a session for all of the given login options
    let incoming_login_thread = spawn_blocking(move || {
        create_incoming_session(&incoming_credentials.0, &incoming_credentials.1)
    });
    // let outgoing_login_thread;

    let incoming_session = incoming_login_thread.await.unwrap()?;

    let mail_sessions = MailSessions::new(incoming_session);

    Ok(mail_sessions)
}

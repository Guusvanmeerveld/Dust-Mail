#[cfg(feature = "imap")]
use crate::imap::ImapClient;

#[cfg(feature = "pop")]
use crate::pop::PopClient;

use crate::types::{self, MailBox, Message, Preview};

pub enum ConnectionSecurity {
    Tls,
    StartTls,
    None,
}

pub struct LoginOptions {
    server: String,
    port: u16,
    security: ConnectionSecurity,
}

impl LoginOptions {
    pub fn new(server: &str, port: u16, security: ConnectionSecurity) -> Self {
        Self {
            server: server.to_owned(),
            port,
            security,
        }
    }

    pub fn server(&self) -> &str {
        &self.server
    }

    pub fn port(&self) -> &u16 {
        &self.port
    }

    pub fn security(&self) -> &ConnectionSecurity {
        &self.security
    }
}

pub trait Client {
    fn login(
        &mut self,
        username: &str,
        password: &str,
        options: Option<LoginOptions>,
    ) -> types::Result<()>;

    fn is_logged_in(&mut self) -> bool;

    fn logout(&mut self) -> types::Result<()>;

    fn box_list(&mut self) -> types::Result<Vec<MailBox>>;

    fn get(&mut self, box_id: &str) -> types::Result<&MailBox>;

    fn messages(&mut self, box_id: &str, start: u32, end: u32) -> types::Result<Vec<Preview>>;

    fn get_message(&mut self, box_id: &str, id: &str) -> types::Result<Message>;
}

pub enum ClientType {
    #[cfg(feature = "imap")]
    Imap,
    #[cfg(feature = "pop")]
    Pop,
}

pub struct ClientConstructor {}

impl ClientConstructor {
    pub fn new(client_type: ClientType) -> Box<dyn Client> {
        match client_type {
            #[cfg(feature = "imap")]
            ClientType::Imap => Box::new(ImapClient::new()),
            #[cfg(feature = "pop")]
            Pop => Box::new(PopClient::new()),
        }
    }
}

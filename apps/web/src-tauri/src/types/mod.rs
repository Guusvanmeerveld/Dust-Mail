use std::result;

mod session;

pub use session::Sessions;

use sdk::types::{ConnectionSecurity, IncomingClientType};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct Error {
    message: String,
    kind: ErrorKind,
}

impl Error {
    pub fn new<S: Into<String>>(kind: ErrorKind, msg: S) -> Self {
        Self {
            message: msg.into(),
            kind,
        }
    }
}

#[derive(Serialize)]
pub enum ErrorKind {
    MailError(sdk::types::Error),
    InvalidInput,
    NotLoggedIn,
    DecodeBase64,
    Crypto,
    InvalidToken,
    SerializeJSON,
    DeserializeJSON,
}

pub type Result<T> = result::Result<T, Error>;

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ClientType {
    Incoming(IncomingClientType),
    // Outgoing(OutgoingClientType)
}

#[derive(Deserialize, Serialize)]
pub struct LoginOptions {
    username: String,
    password: String,
    server: String,
    port: u16,
    client_type: ClientType,
    security: ConnectionSecurity,
}

impl LoginOptions {
    pub fn server(&self) -> &str {
        &self.server
    }

    pub fn port(&self) -> &u16 {
        &self.port
    }

    pub fn security(&self) -> &ConnectionSecurity {
        &self.security
    }

    pub fn client_type(&self) -> &ClientType {
        &self.client_type
    }

    pub fn username(&self) -> &str {
        &self.username
    }

    pub fn password(&self) -> &str {
        &self.password
    }
}

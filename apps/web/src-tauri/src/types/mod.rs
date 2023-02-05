use std::result;

// pub mod credentials;
pub mod session;

pub use session::Sessions;
// pub use credentials::Credentials;

use sdk::types::{ConnectionSecurity, IncomingClientType, OutgoingClientType};
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
    IoError,
    NoCacheDir,
    InvalidInput,
    NotLoggedIn,
    DecodeBase64,
    Crypto,
    InvalidToken,
    SerializeJSON,
    DeserializeJSON,
}

pub type Result<T> = result::Result<T, Error>;

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum ClientType {
    Incoming(IncomingClientType),
    Outgoing(OutgoingClientType),
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LoginOptions {
    username: String,
    password: String,
    domain: String,
    port: u16,
    client_type: ClientType,
    security: ConnectionSecurity,
}

impl LoginOptions {
    pub fn domain(&self) -> &str {
        &self.domain
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

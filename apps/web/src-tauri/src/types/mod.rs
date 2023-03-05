use std::result;

// pub mod credentials;
pub mod session;

pub use session::Sessions;
// pub use credentials::Credentials;

use serde::Serialize;

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

impl From<sdk::types::Error> for Error {
    fn from(sdk_error: sdk::types::Error) -> Self {
        Error::new(
            ErrorKind::MailError(sdk_error),
            "Error with upstream mail server",
        )
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

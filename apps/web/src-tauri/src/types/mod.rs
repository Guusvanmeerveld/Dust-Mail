use std::{
    error::{self, Error as StdError},
    fmt,
    io::Error as IoError,
    result,
};

// pub use credentials::Credentials;

use keyring::Error as KeyringError;
use sdk::types::Error as SdkError;
use serde_json::Error as JsonError;

use serde::{ser::SerializeStruct, Serialize};

#[derive(Debug)]
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

    pub fn kind(&self) -> &ErrorKind {
        &self.kind
    }
}

impl From<SdkError> for Error {
    fn from(sdk_error: SdkError) -> Self {
        Error::new(
            ErrorKind::Mail(sdk_error),
            "Error with upstream mail server",
        )
    }
}

impl From<KeyringError> for Error {
    fn from(keyring_error: KeyringError) -> Self {
        Error::new(ErrorKind::Keyring(keyring_error), "Error with keyring")
    }
}

impl From<JsonError> for Error {
    fn from(json_error: JsonError) -> Self {
        Error::new(
            ErrorKind::Json(json_error),
            "Failed to serialize/deserialize json data",
        )
    }
}

impl From<IoError> for Error {
    fn from(io_error: IoError) -> Self {
        Error::new(ErrorKind::Io(io_error), "IO error")
    }
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let source = self.source().unwrap_or(&self);
        let mut state = serializer.serialize_struct("Error", 2)?;

        state.serialize_field("message", &source.to_string())?;
        state.serialize_field("kind", "MailError")?;
        state.end()
    }
}

impl StdError for Error {
    fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match self.kind() {
            ErrorKind::Io(e) => e.source(),
            ErrorKind::Json(e) => e.source(),
            ErrorKind::Keyring(e) => e.source(),
            ErrorKind::Mail(e) => e.source(),
            _ => None,
        }
    }

    fn description(&self) -> &str {
        &self.message
    }
}

#[derive(Debug)]
pub enum ErrorKind {
    Mail(SdkError),
    Io(IoError),
    Keyring(KeyringError),
    Json(JsonError),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

pub type Result<T> = result::Result<T, Error>;

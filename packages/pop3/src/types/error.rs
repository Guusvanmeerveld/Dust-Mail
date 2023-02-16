use serde::Serialize;

use std::fmt;

#[derive(Debug, Serialize)]
pub enum ErrorKind {
    Connect,
    NotConnected,
    ShouldNotBeConnected,
    IncorrectStateForCommand,
    MessageIsDeleted,
    FeatureUnsupported,
    ServerFailedToGreet,
    ParseServerAddress,
    SecureConnection,
    SendCommand,
    InvalidResponse,
    NoResponse,
    ServerError,
}

#[derive(Serialize, Debug)]
pub struct Error {
    message: String,
    kind: ErrorKind,
}

impl Error {
    pub fn new<S>(error_kind: ErrorKind, message: S) -> Self
    where
        String: From<S>,
    {
        Self {
            message: message.into(),
            kind: error_kind,
        }
    }

    pub fn message(&self) -> &str {
        &self.message
    }

    pub fn kind(&self) -> &ErrorKind {
        &self.kind
    }
}

impl Into<String> for Error {
    fn into(self) -> String {
        self.message
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

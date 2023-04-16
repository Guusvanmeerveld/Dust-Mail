use std::{error, fmt};

use async_native_tls::Error as TlsError;
use tokio::{io::Error as IoError, time::error::Elapsed as TimeoutError};

#[derive(Debug)]
pub enum ErrorKind {
    Tls(TlsError),
    Io(IoError),
    Timeout(TimeoutError),
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

#[derive(Debug)]
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

impl error::Error for Error {
    fn description(&self) -> &str {
        &self.message
    }

    fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match self.kind() {
            _ => None,
        }
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

impl From<TlsError> for Error {
    fn from(tls_error: async_native_tls::Error) -> Self {
        Self::new(
            ErrorKind::Tls(tls_error),
            "Error creating secure connection",
        )
    }
}

impl From<IoError> for Error {
    fn from(io_error: IoError) -> Self {
        Self::new(ErrorKind::Io(io_error), "Error with connection to server")
    }
}

impl From<TimeoutError> for Error {
    fn from(timeout_error: TimeoutError) -> Self {
        Self::new(
            ErrorKind::Timeout(timeout_error),
            "Timeout when connecting to server",
        )
    }
}

use std::fmt;

#[cfg(feature = "pop")]
use pop3::types::Error as PopError;

use serde::Serialize;

#[derive(Debug, Serialize)]
pub enum ErrorKind {
    /// Failed to connect to the remote mail server.
    Connect,
    /// The server responded with some unexpected data.
    UnexpectedBehavior,
    /// The requested feature/function is unsupported for this client type.
    Unsupported,
    /// Failed to create a secure connection.
    SecureConnection,
    #[cfg(feature = "imap")]
    /// An error from the Imap server.
    ImapError,
    #[cfg(feature = "pop")]
    /// An error from the Pop server.
    PopError(PopError),
    /// Failed to parse a socket address which is used to connect to the remote mail server
    ParseAddress,
    /// Failed to parse a date from the server.
    ParseDate,
    /// Failed to parse the emails message body.
    ParseMessage,
    /// Failed to serialize the given data to JSON.
    SerializeJSON,
    /// Something went wrong when fetching the email provider config for a given email address.
    FetchConfigFailed,
    /// Could not detect a config from the given email address.
    ConfigNotFound,
}

#[derive(Debug, Serialize)]
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

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

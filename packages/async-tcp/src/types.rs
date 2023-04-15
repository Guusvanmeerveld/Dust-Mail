use std::{error, fmt, result, string::FromUtf8Error as ParseStringError};

use tokio::{io::Error as IoError, time::error::Elapsed as TimeoutError};

use async_native_tls::Error as TlsError;

#[derive(Debug)]
pub struct Error {
    message: String,
    kind: ErrorKind,
}

impl Error {
    pub fn new<S: Into<String>>(kind: ErrorKind, message: S) -> Self {
        Self {
            message: message.into(),
            kind,
        }
    }

    pub fn kind(&self) -> &ErrorKind {
        &self.kind
    }
}

impl From<ParseStringError> for Error {
    fn from(parse_string_error: ParseStringError) -> Self {
        Error::new(
            ErrorKind::ParseString(parse_string_error),
            "An error occured converting an array of bytes to string",
        )
    }
}

impl From<IoError> for Error {
    fn from(io_error: IoError) -> Self {
        Error::new(ErrorKind::Io(io_error), "An io error occurred")
    }
}

impl From<TimeoutError> for Error {
    fn from(timeout_error: TimeoutError) -> Self {
        Error::new(ErrorKind::Timeout(timeout_error), "Connection timeout")
    }
}

impl From<TlsError> for Error {
    fn from(tls_error: TlsError) -> Self {
        Error::new(
            ErrorKind::Tls(tls_error),
            "An error with the secure connection occurred",
        )
    }
}

impl error::Error for Error {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match &self.kind {
            ErrorKind::Io(io_error) => Some(io_error),
            ErrorKind::Timeout(timeout_error) => Some(timeout_error),
            ErrorKind::Tls(tls_error) => Some(tls_error),
            ErrorKind::ParseString(parse_string_error) => Some(parse_string_error),
            _ => None,
        }
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

#[derive(Debug)]
pub enum ErrorKind {
    Io(IoError),
    Timeout(TimeoutError),
    Tls(TlsError),
    ParseString(ParseStringError),
    EmptyResponse,
}

pub type Result<T> = result::Result<T, Error>;

pub mod config;

use std::{error, fmt, result};

#[derive(Debug)]
pub enum ErrorKind {
    Http(reqwest::Error),
    InvalidResponse,
    Timeout,
    BadInput,
    NotFound,
    Parse,
}

#[derive(Debug)]
pub struct Error {
    kind: ErrorKind,
    message: String,
}

impl Error {
    pub fn new<S: Into<String>>(kind: ErrorKind, msg: S) -> Self {
        Self {
            kind,
            message: msg.into(),
        }
    }

    pub fn kind(&self) -> &ErrorKind {
        &self.kind
    }

    pub fn message(&self) -> &str {
        &self.message
    }
}

impl From<reqwest::Error> for Error {
    fn from(http_error: reqwest::Error) -> Self {
        Self::new(
            ErrorKind::Http(http_error),
            "Error with outgoing http request",
        )
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

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

pub type Result<T> = result::Result<T, Error>;

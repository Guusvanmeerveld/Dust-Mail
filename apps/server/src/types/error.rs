use std::{error, fmt};

use rocket::serde::Serialize;
use sdk::types::Error as SdkError;

#[derive(Serialize, Debug)]
#[serde(crate = "rocket::serde")]
pub enum ErrorKind {
    SdkError(SdkError),
    CreateHttpRequest,
    BadConfig,
    Unauthorized,
    BadRequest,
    TooManyRequests,
    NotFound,
    Parse,
    InternalError,
}

#[derive(Serialize, Debug)]
#[serde(crate = "rocket::serde")]
pub struct Error {
    message: String,
    kind: ErrorKind,
}

impl From<SdkError> for Error {
    fn from(error: SdkError) -> Self {
        Self {
            kind: ErrorKind::SdkError(error),
            message: String::from("Error with upstream mail server"),
        }
    }
}

impl Error {
    pub fn new<S: Into<String>>(kind: ErrorKind, message: S) -> Self {
        Self {
            kind,
            message: message.into(),
        }
    }

    pub fn kind(&self) -> &ErrorKind {
        &self.kind
    }
}

impl error::Error for Error {
    fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match self.kind() {
            ErrorKind::SdkError(e) => Some(e),
            _ => None,
        }
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

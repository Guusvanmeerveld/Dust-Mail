use rocket::serde::Serialize;
use sdk::types::Error as SdkError;

#[derive(Serialize, Debug)]
#[serde(crate = "rocket::serde")]
pub enum ErrorKind {
    SdkError(SdkError),
    Unauthorized,
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

mod config;

pub use config::Config;

use std::result;

#[derive(Debug)]
pub enum ErrorKind {
    BadInput,
    NotFound,
    Http,
    Parse,
}

#[derive(Debug)]
pub struct Error {
    kind: ErrorKind,
    msg: String,
}

impl Error {
    pub fn new<S: Into<String>>(kind: ErrorKind, msg: S) -> Self {
        Self {
            kind,
            msg: msg.into(),
        }
    }
}

pub type Result<T> = result::Result<T, Error>;

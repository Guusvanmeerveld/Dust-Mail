use std::fmt;

#[derive(Debug)]
pub enum ErrorKind {
    /// An error with the connection to the remote server
    Connection,
    /// A requested feature/command is not available
    Unsupported,
    /// An error while creating a secure connection
    Security,
    /// Received a response from the server which was not in line with the expected response
    UnexpectedBehavior,
    /// An error occurred with the given data
    Input,
    /// An error from the remote server
    Server,
    /// An occurred error reading the server response
    Read,
    /// An occurred error sending data to the server
    Write,
    /// Could not detect a config from the given email address
    ConfigNotFound,
}

#[derive(Debug)]
pub struct Error {
    msg: String,
    kind: ErrorKind,
}

impl Error {
    pub fn new<S: Into<String>>(kind: ErrorKind, msg: S) -> Self {
        Self {
            msg: msg.into(),
            kind,
        }
    }

    pub fn kind(&self) -> &ErrorKind {
        &self.kind
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.msg)
    }
}

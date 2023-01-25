use std::fmt;

#[derive(Debug)]
pub enum ErrorKind {
    Connection,
    Server,
    State,
    Read,
    Write,
    Tls,
}

#[derive(Debug)]
pub struct Error {
    msg: String,
    kind: ErrorKind,
}

impl Error {
    pub fn new<S>(error_kind: ErrorKind, msg: S) -> Self
    where
        String: From<S>,
    {
        Self {
            msg: msg.into(),
            kind: error_kind,
        }
    }

    pub fn message(&self) -> &str {
        &self.msg
    }

    pub fn kind(&self) -> &ErrorKind {
        &self.kind
    }
}

impl Into<String> for Error {
    fn into(self) -> String {
        self.msg
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.msg)
    }
}
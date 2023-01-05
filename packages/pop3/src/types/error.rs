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

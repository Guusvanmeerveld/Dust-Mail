use serde::{Deserialize, Serialize};

#[derive(Debug, PartialEq, Eq, Deserialize, Serialize, Clone)]
pub enum IncomingClientType {
    #[cfg(feature = "imap")]
    Imap,
    #[cfg(feature = "pop")]
    Pop,
}

#[derive(Debug, PartialEq, Eq, Deserialize, Serialize, Clone)]
pub enum OutgoingClientType {
    #[cfg(feature = "smtp")]
    Smtp,
}

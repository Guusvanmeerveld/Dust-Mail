use std::io::{Read, Write};

#[cfg(feature = "imap")]
use crate::imap::{ImapClient, ImapSession};
#[cfg(feature = "pop")]
use crate::pop::PopSession;

#[derive(Debug, PartialEq, Eq)]
pub enum ClientType {
    #[cfg(feature = "imap")]
    Imap,
    #[cfg(feature = "pop")]
    Pop,
}

pub enum ClientTypeWithClient<S>
where
    S: Read + Write,
{
    #[cfg(feature = "imap")]
    Imap(ImapClient<S>),
    #[cfg(feature = "pop")]
    Pop(PopSession<S>),
}

pub enum ClientTypeWithSession<S>
where
    S: Read + Write,
{
    #[cfg(feature = "imap")]
    Imap(ImapSession<S>),
    #[cfg(feature = "pop")]
    Pop(PopSession<S>),
}

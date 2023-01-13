use std::io::{Read, Write};

#[cfg(feature = "imap")]
use crate::imap::ImapClient;
#[cfg(feature = "pop")]
use crate::pop::PopClient;

#[derive(Debug, PartialEq, Eq)]
pub enum IncomingClientType {
    #[cfg(feature = "imap")]
    Imap,
    #[cfg(feature = "pop")]
    Pop,
}

pub enum IncomingClientTypeWithClient<S>
where
    S: Read + Write,
{
    #[cfg(feature = "imap")]
    Imap(ImapClient<S>),
    #[cfg(feature = "pop")]
    Pop(PopClient<S>),
}

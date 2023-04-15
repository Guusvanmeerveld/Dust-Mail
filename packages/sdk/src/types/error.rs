use std::{error, fmt};

#[cfg(feature = "pop")]
use async_pop3::types::Error as PopError;

#[cfg(feature = "imap")]
use async_imap::error::Error as ImapError;

#[cfg(feature = "autoconfig")]
use autoconfig::types::Error as AutoconfigError;

use async_tcp::types::Error as TcpError;

use async_native_tls::Error as TlsError;

use chrono::ParseError as ParseTimeError;

use mailparse::MailParseError;
use tokio::{task::JoinError, time::error::Elapsed};

#[derive(Debug)]
pub enum ErrorKind {
    /// The server responded with some unexpected data.
    UnexpectedBehavior,
    /// The requested feature/function is unsupported for this client type.
    Unsupported,
    Io(tokio::io::Error),
    #[cfg(feature = "imap")]
    /// An error from the Imap server.
    Imap(ImapError),
    #[cfg(feature = "pop")]
    /// An error from the Pop server.
    Pop(PopError),
    Tls(TlsError),
    Tcp(TcpError),
    /// Failed to parse a date/time from the server.
    ParseTime(ParseTimeError),
    Timeout(Elapsed),
    #[cfg(feature = "autoconfig")]
    /// Something went wrong when fetching the email provider config for a given email address.
    AutoConfig(AutoconfigError),
    /// Failed to parse a string given by the server.
    ParseString,
    /// Failed to parse a socket address which is used to connect to the remote mail server
    ParseAddress,
    /// Failed to parse provided login config.
    InvalidLoginConfig,
    /// Failed to parse mail message.
    ParseMessage(MailParseError),
    InvalidMessage,
    /// Error from the remote mail server.
    MailServer,
    /// Failed to serialize the given data to JSON.
    SerializeJSON,
    /// Could not detect a config from the given email address.
    ConfigNotFound,
    SpawnAsync,
    MailBoxNotFound,
    NoClientAvailable,
}

#[derive(Debug)]
pub struct Error {
    message: String,
    kind: ErrorKind,
}

impl Error {
    pub fn new<S: Into<String>>(kind: ErrorKind, msg: S) -> Self {
        Self {
            message: msg.into(),
            kind,
        }
    }

    pub fn kind(&self) -> &ErrorKind {
        &self.kind
    }
}

impl error::Error for Error {
    fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match self.kind() {
            ErrorKind::Pop(e) => Some(e),
            ErrorKind::Imap(e) => Some(e),
            ErrorKind::Io(e) => Some(e),
            ErrorKind::Tls(e) => Some(e),
            ErrorKind::ParseMessage(e) => Some(e),
            ErrorKind::Tcp(e) => Some(e),
            _ => None,
        }
    }
}

#[cfg(feature = "pop")]
impl From<PopError> for Error {
    fn from(pop_error: PopError) -> Self {
        Self::new(ErrorKind::Pop(pop_error), "Error from pop server")
    }
}

#[cfg(feature = "imap")]
impl From<ImapError> for Error {
    fn from(imap_error: ImapError) -> Self {
        Self::new(
            ErrorKind::Imap(imap_error),
            format!("Error from imap server "),
        )
    }
}

impl From<JoinError> for Error {
    fn from(join_error: JoinError) -> Self {
        Self::new(
            ErrorKind::SpawnAsync,
            format!("Failed to spawn async task: {}", join_error),
        )
    }
}

impl From<TcpError> for Error {
    fn from(tcp_error: TcpError) -> Self {
        Self::new(
            ErrorKind::Tcp(tcp_error),
            "An error occurred with the remote connection",
        )
    }
}

impl From<TlsError> for Error {
    fn from(native_tls_error: TlsError) -> Self {
        Error::new(
            ErrorKind::Tls(native_tls_error),
            format!("Error creating a secure connection"),
        )
    }
}

impl From<tokio::io::Error> for Error {
    fn from(io_error: tokio::io::Error) -> Self {
        Error::new(ErrorKind::Io(io_error), "Error with io")
    }
}

impl From<ParseTimeError> for Error {
    fn from(chrono_error: ParseTimeError) -> Self {
        Error::new(
            ErrorKind::ParseTime(chrono_error),
            "Failed to parse date time",
        )
    }
}

impl From<Elapsed> for Error {
    fn from(timeout_error: Elapsed) -> Self {
        Error::new(ErrorKind::Timeout(timeout_error), "Timeout error")
    }
}

impl From<MailParseError> for Error {
    fn from(mailparse_error: MailParseError) -> Self {
        Error::new(
            ErrorKind::ParseMessage(mailparse_error),
            "Failed to parse mail message",
        )
    }
}

#[cfg(feature = "autoconfig")]
impl From<AutoconfigError> for Error {
    fn from(autoconfig_error: AutoconfigError) -> Self {
        Error::new(
            ErrorKind::AutoConfig(autoconfig_error),
            "Failed to retrieve mail config from remote provider",
        )
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

mod error;
mod mailbox;
mod message;

use std::result;

pub use error::{Error, ErrorKind};
pub use mailbox::MailBox;
pub use message::{Address, Content, Message, Preview};

pub type Result<T> = result::Result<T, Error>;

mod client;
mod error;
mod login;
mod mailbox;
mod message;

use std::result;

pub use client::*;
pub use error::{Error, ErrorKind};
pub use login::{ConnectionSecurity, LoginOptions};
pub use mailbox::MailBox;
pub use message::{Address, Content, Message, Preview};

pub type Result<T> = result::Result<T, Error>;

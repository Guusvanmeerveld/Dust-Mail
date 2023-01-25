mod client;
mod error;
mod flags;
mod login;
mod mailbox;
mod message;

use std::result;

pub use client::*;
pub use error::{Error, ErrorKind};
pub use flags::Flag;
pub use login::{ConnectionSecurity, LoginOptions};
pub use mailbox::{Counts, MailBox};
pub use message::{Address, Content, Message, Preview};

pub type Result<T> = result::Result<T, Error>;

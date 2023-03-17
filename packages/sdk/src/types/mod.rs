mod client;
mod connection;
mod error;
mod flags;
mod mailbox;
mod message;
mod oauth2;

use std::{collections::HashMap, result};

pub use client::*;
pub use connection::ConnectionSecurity;
pub use error::{Error, ErrorKind};
pub use flags::Flag;
pub use mailbox::{Counts, MailBox};
pub use message::{Address, Content, Message, Preview};
pub use oauth2::OAuthCredentials;

pub type Result<T> = result::Result<T, Error>;

pub type Headers = HashMap<String, String>;

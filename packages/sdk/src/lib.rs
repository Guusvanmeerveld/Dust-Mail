mod client;
mod parse;
mod tls;
mod utils;

#[cfg(feature = "detect")]
pub mod detect;

#[cfg(feature = "imap")]
mod imap;

#[cfg(feature = "pop")]
mod pop;

pub mod types;

pub mod session;

pub use client::incoming::{
    ClientConstructor as IncomingClientConstructor, Session as IncomingSession,
};

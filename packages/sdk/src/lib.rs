mod cache;
mod client;
mod parse;

#[cfg(feature = "detect")]
pub mod detect;

#[cfg(feature = "imap")]
mod imap;

#[cfg(feature = "pop")]
mod pop;

pub mod types;

pub mod session;

pub use client::incoming::{IncomingClientBuilder, IncomingSession};

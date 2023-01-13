mod client;
mod detect;
mod parse;
mod tls;
mod utils;

#[cfg(feature = "imap")]
mod imap;

#[cfg(feature = "pop")]
mod pop;

pub mod types;

pub use client::incoming::{
    ClientConstructor as IncomingClientConstructor, Session as IncomingSession,
};

pub use detect::ServiceDetector;

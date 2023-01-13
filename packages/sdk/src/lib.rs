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

pub use client::ClientConstructor;
pub use detect::ServiceDetector;

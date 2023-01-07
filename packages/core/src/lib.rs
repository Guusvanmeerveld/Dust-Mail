mod client;
mod detect;
mod tls;
mod utils;

#[cfg(feature = "imap")]
mod imap;

#[cfg(feature = "pop")]
mod pop;

pub mod types;

pub use client::{ClientConstructor, ClientType, LoginOptions};
pub use detect::ServiceDetector;

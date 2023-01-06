use std::result;

mod error;
mod stat;
mod uidl;

pub use error::{Error, ErrorKind};
pub use stat::Stats;
pub use uidl::UniqueID;

pub type Result<T> = result::Result<T, Error>;

pub use either::Either::{Left, Right};

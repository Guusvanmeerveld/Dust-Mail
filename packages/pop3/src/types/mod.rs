use std::result;

mod error;
mod list;
mod stat;
mod uidl;

pub use error::{Error, ErrorKind};
pub use list::ListItem;
pub use stat::Stats;
pub use uidl::UniqueID;

pub type Result<T> = result::Result<T, Error>;

pub use either::Either::{Left, Right};

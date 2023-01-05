use std::result;

mod error;
mod list;
mod stat;

pub use error::{Error, ErrorKind};
pub use list::ListItem;
pub use stat::Stats;

pub type Result<T> = result::Result<T, Error>;

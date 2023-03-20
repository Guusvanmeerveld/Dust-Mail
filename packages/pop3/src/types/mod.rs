use std::result;

mod capability;
mod error;
mod stat;
mod uidl;

pub use capability::{Capabilities, Capability};
pub use error::{Error, ErrorKind};
pub use stat::{Stats, StatsResponse};
pub use uidl::{UniqueID, UniqueIDResponse};

pub type Result<T> = result::Result<T, Error>;

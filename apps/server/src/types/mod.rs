use rocket::{http::Status, serde::json::Json};
mod error;
mod response;

use std::result;

pub use error::{Error, ErrorKind};

pub use response::{ErrResponse, OkResponse};

pub type Result<T> = result::Result<T, Error>;

pub type ResponseResult<T> = result::Result<Json<OkResponse<T>>, (Status, Json<ErrResponse>)>;

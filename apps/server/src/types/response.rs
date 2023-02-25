use rocket::serde::{json::Json, Serialize};

use super::{Error, ErrorKind};

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct OkResponse<T: Serialize> {
    ok: bool,
    data: T,
}

impl<T: Serialize> OkResponse<T> {
    pub fn new(data: T) -> Json<Self> {
        Json(Self { ok: true, data })
    }
}

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct ErrResponse {
    ok: bool,
    error: Error,
}

impl ErrResponse {
    pub fn from_err(error: Error) -> Json<Self> {
        Json(Self { ok: false, error })
    }

    pub fn new<S: Into<String>>(kind: ErrorKind, msg: S) -> Json<Self> {
        Json(Self {
            ok: false,
            error: Error::new(kind, msg),
        })
    }
}

use rocket::{
    http::Status,
    serde::{json::Json, Serialize},
};

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

#[derive(Serialize, Debug)]
#[serde(crate = "rocket::serde")]
pub struct ErrResponse {
    ok: bool,
    error: Error,
}

impl ErrResponse {
    pub fn from_err(error: Error) -> (Status, Json<Self>) {
        let status = Self::find_status_from_error_kind(error.kind());
        let json = Json(Self { ok: false, error });

        (status, json)
    }

    fn find_status_from_error_kind(error_kind: &ErrorKind) -> Status {
        match error_kind {
            ErrorKind::TooManyRequests => Status::TooManyRequests,
            ErrorKind::InternalError => Status::InternalServerError,
            ErrorKind::NotFound => Status::NotFound,
            ErrorKind::Parse => Status::BadRequest,
            ErrorKind::SdkError(_) => Status::InternalServerError,
        }
    }

    pub fn new<S: Into<String>>(kind: ErrorKind, msg: S) -> (Status, Json<Self>) {
        let status = Self::find_status_from_error_kind(&kind);

        let json = Json(Self {
            ok: false,
            error: Error::new(kind, msg),
        });

        (status, json)
    }
}

use rocket::{
    request::{FromRequest, Outcome},
    serde::json::Json,
    Request,
};

use crate::types::{ErrResponse, ErrorKind};

pub struct User {}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for User {
    type Error = Json<ErrResponse>;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let cookies = req.cookies();

        let token = match cookies.get_private("login") {
            Some(cookie) => cookie.value().to_string(),
            None => {
                return Outcome::Failure(ErrResponse::new(
                    ErrorKind::Unauthorized,
                    "Missing authorization cookie",
                ))
            }
        };

        Outcome::Success(User {})
    }
}

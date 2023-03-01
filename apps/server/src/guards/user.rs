use rocket::{
    request::{FromRequest, Outcome},
    serde::json::Json,
    Request,
};

use crate::types::{ErrResponse, ErrorKind};

pub struct User {
    token: String,
}

impl User {
    pub fn new<S: Into<String>>(token: S) -> Self {
        User {
            token: token.into(),
        }
    }

    pub fn token(&self) -> &str {
        &self.token
    }
}

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
                    "You are not logged in",
                ))
            }
        };

        Outcome::Success(User::new(token))
    }
}

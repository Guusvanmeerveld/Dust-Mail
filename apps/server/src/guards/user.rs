use std::sync::Arc;

use rocket::{
    request::{FromRequest, Outcome},
    serde::json::Json,
    Request,
};

use crate::{
    state::{GlobalUserSessions, UserSession},
    types::{ErrResponse, ErrorKind},
};

pub struct User {
    token: String,
    mail_sessions: Arc<UserSession>,
}

impl User {
    pub fn new<S: Into<String>>(token: S, mail_sessions: Arc<UserSession>) -> Self {
        User {
            mail_sessions,
            token: token.into(),
        }
    }

    pub fn mail_sessions(&self) -> Arc<UserSession> {
        self.mail_sessions.clone()
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

        let token = match cookies.get_private("session") {
            Some(cookie) => cookie.value().to_string(),
            None => {
                return Outcome::Failure(ErrResponse::new(
                    ErrorKind::Unauthorized,
                    "You are not logged in",
                ))
            }
        };

        match req.rocket().state::<GlobalUserSessions>() {
            Some(user_sessions) => {
                let user_session = user_sessions.get(&token);

                Outcome::Success(User::new(token, user_session))
            }
            None => {
                let error = ErrResponse::new(
                    ErrorKind::InternalError,
                    "Could not retrieve user session handler",
                );

                Outcome::Failure(error)
            }
        }
    }
}

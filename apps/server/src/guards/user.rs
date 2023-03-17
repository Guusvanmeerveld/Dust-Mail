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
    mail_sessions: Arc<UserSession>,
}

impl User {
    pub fn new(mail_sessions: Arc<UserSession>) -> Self {
        User { mail_sessions }
    }

    pub fn mail_sessions(&self) -> Arc<UserSession> {
        self.mail_sessions.clone()
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

                Outcome::Success(User::new(user_session))
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

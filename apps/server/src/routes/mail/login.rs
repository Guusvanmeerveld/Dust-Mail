use crate::{
    guards::{RateLimiter, User},
    types::{ErrResponse, Error, ErrorKind, OkResponse, ResponseResult},
};

use base64::Engine;
use rocket::serde::json::Json;
use sdk::session::{create_sessions, Credentials};

const BASE64_ENGINE: base64::engine::GeneralPurpose = base64::engine::GeneralPurpose::new(
    &base64::alphabet::URL_SAFE,
    base64::engine::general_purpose::NO_PAD,
);

#[post("/login", data = "<credentials>")]
pub async fn login(
    credentials: Json<Credentials>,
    user: User,
    _rate_limiter: RateLimiter,
) -> ResponseResult<String> {
    let session_token = BASE64_ENGINE.encode::<String>(credentials.clone().0.into());

    match user.mail_sessions().get(&session_token) {
        Some(_) => Err(ErrResponse::new(
            ErrorKind::BadRequest,
            format!(
                "You already have a session connected to that server with token '{}'",
                session_token
            ),
        )),
        None => {
            let mail_sessions = create_sessions(&credentials)
                .await
                .map_err(|err| ErrResponse::from(Error::from(err)).into())?;

            user.mail_sessions().insert(&session_token, mail_sessions);

            Ok(OkResponse::new(session_token))
        }
    }
}

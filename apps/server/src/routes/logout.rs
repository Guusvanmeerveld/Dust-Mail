use rocket::{http::CookieJar, State};

use crate::{
    guards::RateLimiter,
    state::GlobalUserSessions,
    types::{ErrResponse, ErrorKind, OkResponse, ResponseResult},
};

#[post("/logout")]
pub fn logout<'a>(
    cookies: &CookieJar<'_>,
    mail_sessions: &State<GlobalUserSessions>,
    _rate_limiter: RateLimiter,
) -> ResponseResult<&'a str> {
    match cookies.get_private("session") {
        Some(cookie) => {
            let secret_token = cookie.value();

            mail_sessions.remove(secret_token);

            cookies.remove_private(cookie);

            Ok(OkResponse::new("Successfully logged out"))
        }
        None => Err(ErrResponse::new(
            ErrorKind::BadRequest,
            "You are not logged in",
        )),
    }
}

use rocket::http::CookieJar;

use crate::{
    guards::RateLimiter,
    types::{ErrResponse, ErrorKind, OkResponse, ResponseResult},
};

#[post("/logout")]
pub fn logout<'a>(cookies: &CookieJar<'_>, _rate_limiter: RateLimiter) -> ResponseResult<&'a str> {
    match cookies.get_private("login") {
        Some(cookie) => {
            cookies.remove_private(cookie);

            Ok(OkResponse::new("Successfully logged out"))
        }
        None => Err(ErrResponse::new(
            ErrorKind::BadRequest,
            "You are not logged in",
        )),
    }
}

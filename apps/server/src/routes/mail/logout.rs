use crate::{
    guards::{RateLimiter, User},
    types::{ErrResponse, Error, OkResponse, ResponseResult},
};

#[post("/logout/<session_token>")]
pub fn logout(
    session_token: String,
    user: User,
    _rate_limiter: RateLimiter,
) -> ResponseResult<String> {
    let incoming_session = user
        .mail_sessions()
        .get_incoming(&session_token)
        .map_err(|err| ErrResponse::from(err).into())?;

    let mut incoming_session_lock = incoming_session.lock().unwrap();

    incoming_session_lock
        .logout()
        .map_err(|err| ErrResponse::from(Error::from(err)).into())?;

    user.mail_sessions().remove(session_token);

    Ok(OkResponse::new(String::from("Logout successfull")))
}

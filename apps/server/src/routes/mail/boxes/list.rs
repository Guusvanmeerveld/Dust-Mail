use sdk::types::MailBox;

use crate::{
    guards::{RateLimiter, User},
    types::{ErrResponse, Error, OkResponse, ResponseResult},
};

#[get("/list?<session_token>")]
pub fn box_list(
    session_token: String,
    user: User,
    _rate_limiter: RateLimiter,
) -> ResponseResult<Vec<MailBox>> {
    let incoming_session = user
        .mail_sessions()
        .get_incoming(session_token)
        .map_err(|err| ErrResponse::from(err).into())?;

    let mut incoming_session_lock = incoming_session.lock().unwrap();

    incoming_session_lock
        .box_list()
        .map(|list| OkResponse::new(list.clone()))
        .map_err(|err| ErrResponse::from(Error::from(err)).into())
}

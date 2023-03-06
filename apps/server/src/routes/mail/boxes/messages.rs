use sdk::types::Preview;

use crate::{
    guards::{RateLimiter, User},
    types::{ErrResponse, Error, OkResponse, ResponseResult},
};

#[get("/<box_id>/messages?<start>&<end>&<session_token>")]
pub fn get_messages(
    session_token: String,
    box_id: String,
    start: u32,
    end: u32,
    user: User,
    _rate_limiter: RateLimiter,
) -> ResponseResult<Vec<Preview>> {
    let incoming_session = user
        .mail_sessions()
        .get_incoming(session_token)
        .map_err(|err| ErrResponse::from(err).into())?;

    let mut incoming_session_lock = incoming_session.lock().unwrap();

    incoming_session_lock
        .messages(&box_id, start, end)
        .map(|previews| OkResponse::new(previews))
        .map_err(|err| ErrResponse::from(Error::from(err)).into())
}

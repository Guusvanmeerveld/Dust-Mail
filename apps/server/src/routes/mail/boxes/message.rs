use sdk::types::Message;

use crate::{
    guards::{RateLimiter, User},
    types::{ErrResponse, Error, OkResponse, ResponseResult},
};

#[get("/<box_id>/<message_id>?<session_token>")]
pub fn get_message(
    session_token: String,
    box_id: String,
    message_id: String,
    user: User,
    _rate_limiter: RateLimiter,
) -> ResponseResult<Message> {
    let incoming_session = user
        .mail_sessions()
        .get_incoming(session_token)
        .map_err(|err| ErrResponse::from(err).into())?;

    let mut incoming_session_lock = incoming_session.lock().unwrap();

    incoming_session_lock
        .get_message(&box_id, &message_id)
        .map(|message| OkResponse::new(message))
        .map_err(|err| ErrResponse::from(Error::from(err)).into())
}

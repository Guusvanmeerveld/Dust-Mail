use sdk::types::MailBox;

use crate::{
    guards::{RateLimiter, User},
    types::{ErrResponse, Error, OkResponse, ResponseResult},
};

#[get("/<box_id>?<session_token>")]
pub fn get_box(
    session_token: String,
    box_id: String,
    user: User,
    _rate_limiter: RateLimiter,
) -> ResponseResult<MailBox> {
    let incoming_session = user
        .mail_sessions()
        .get_incoming(session_token)
        .map_err(|err| ErrResponse::from(err).into())?;

    let mut incoming_session_lock = incoming_session.lock().unwrap();

    incoming_session_lock
        .get(&box_id)
        .map(|mailbox| OkResponse::new(mailbox.clone()))
        .map_err(|err| ErrResponse::from(Error::from(err)).into())
}

use crate::{
    cache::ConfigCache,
    guards::{RateLimiter, User},
    types::{ErrResponse, ErrorKind, OkResponse, ResponseResult},
};

use rocket::State;
use sdk::detect::{self, Config};

#[get("/detect/<email>")]
pub async fn auto_detect_config(
    email: String,
    _user: User,
    _rate_limiter: RateLimiter,
    cache: &State<ConfigCache>,
) -> ResponseResult<Config> {
    match cache.get(&email) {
        Some(cached) => Ok(OkResponse::new(cached.item().clone())),
        None => match detect::from_email(&email).await {
            Ok(config) => {
                cache
                    .set(&email, &config)
                    .map_err(|err| ErrResponse::from(err).into())?;

                Ok(OkResponse::new(config))
            }
            Err(err) => Err(ErrResponse::new(
                ErrorKind::SdkError(err),
                "Failed to detect config from email address",
            )),
        },
    }
}

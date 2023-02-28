use crate::{
    cache::ConfigCache,
    guards::RateLimiter,
    types::{ErrResponse, ErrorKind, OkResponse, ResponseResult},
};

use rocket::State;
use sdk::detect::{self, Config};

#[get("/detect/<email>")]
pub async fn auto_detect_config(
    email: &str,
    _rate_limiter: RateLimiter,
    cache: &State<ConfigCache>,
) -> ResponseResult<Config> {
    match cache.get(email) {
        Some(config) => Ok(OkResponse::new(config)),
        None => match detect::from_email(email).await {
            Ok(config) => {
                cache.set(email, &config).map_err(ErrResponse::from_err)?;

                Ok(OkResponse::new(config))
            }
            Err(err) => Err(ErrResponse::new(
                ErrorKind::SdkError(err),
                "Failed to detect config from email address",
            )),
        },
    }
}

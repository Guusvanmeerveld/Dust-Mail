use crate::{
    cache::ConfigCache,
    types::{ErrResponse, ErrorKind, OkResponse, ResponseResult},
};

use rocket::{http::Status, State};
use sdk::detect::{self, Config};

#[get("/detect/<email>")]
pub async fn auto_detect_config(email: &str, cache: &State<ConfigCache>) -> ResponseResult<Config> {
    match cache.get(email) {
        Some(config) => Ok(OkResponse::new(config)),
        None => match detect::from_email(email).await {
            Ok(config) => {
                cache
                    .set(email, config.clone())
                    .map_err(ErrResponse::from_err);

                Ok(OkResponse::new(config))
            }
            Err(err) => Err((
                Status::BadRequest,
                ErrResponse::new(
                    ErrorKind::SdkError(err),
                    "Failed to detect config from email address",
                ),
            )),
        },
    }
}

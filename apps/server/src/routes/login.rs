use crate::types::{OkResponse, ResponseResult};

#[post("/login")]
pub fn login() -> ResponseResult<String> {
    Ok(OkResponse::new("yeet".to_string()))
}

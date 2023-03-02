use crate::{
    guards::User,
    types::{OkResponse, ResponseResult},
};

#[post("/login")]
pub fn login(_user: User) -> ResponseResult<String> {
    Ok(OkResponse::new("Yeet".to_string()))
}

use std::collections::HashMap;

use rocket::State;

use crate::{
    state::Config,
    types::{OkResponse, ResponseResult},
};

#[get("/tokens")]
pub fn get_tokens(config: &State<Config>) -> ResponseResult<HashMap<String, String>> {
    let public_tokens: HashMap<String, String> = config
        .oauth2()
        .providers()
        .iter()
        .map(|(key, value)| return (key.to_string(), value.public_token().to_string()))
        .collect();

    Ok(OkResponse::new(public_tokens))
}

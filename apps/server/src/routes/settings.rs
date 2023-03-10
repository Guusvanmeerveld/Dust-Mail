use rocket::{serde::Serialize, State};

use crate::{
    state::{AuthType, Config},
    types::{OkResponse, ResponseResult},
};

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]

pub struct SettingsResponse {
    authorization: bool,
    authorization_type: Option<AuthType>,
}

#[get("/settings")]
pub fn settings(config: &State<Config>) -> ResponseResult<SettingsResponse> {
    let auth_enabled = config.authorization().is_some();
    let authorization_type = config
        .authorization()
        .map(|auth_config| auth_config.auth_type().clone());

    let settings_response = SettingsResponse {
        authorization: auth_enabled,
        authorization_type,
    };

    Ok(OkResponse::new(settings_response))
}

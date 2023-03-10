use rocket::serde::Serialize;

use crate::types::{OkResponse, ResponseResult};

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct VersionResponse {
    version: String,
    r#type: String,
}

#[get("/version")]
pub fn version() -> ResponseResult<VersionResponse> {
    let response = VersionResponse {
        version: "0.2.4".into(),
        r#type: "git".into(),
    };

    Ok(OkResponse::new(response))
}

use std::collections::HashMap;

use crate::{
    http::HttpClient,
    types::{Error, ErrorKind, Result},
};

use hyper::{header::CONTENT_TYPE, Body, Request};
use rocket::serde::{json::from_slice as parse_json_from_slice, Deserialize};

#[derive(Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct AccessTokenResponse {
    access_token: String,
    token_type: String,
    expires_in: u16,
    refresh_token: Option<String>,
}

impl AccessTokenResponse {
    pub fn access_token(&self) -> &str {
        &self.access_token
    }
}

pub async fn get_access_token<S: AsRef<str>>(
    http_client: &HttpClient,
    token_url: S,
    code: S,
    redirect_uri: S,
    client_id: S,
    client_secret: &Option<String>,
) -> Result<AccessTokenResponse> {
    let mut form_data = HashMap::new();

    form_data.insert("grant_type", "authorization_code");
    form_data.insert("code", code.as_ref());
    form_data.insert("redirect_uri", redirect_uri.as_ref());
    form_data.insert("client_id", client_id.as_ref());

    match client_secret.as_ref() {
        Some(client_secret) => {
            form_data.insert("client_secret", client_secret.as_ref());
        }
        None => {}
    }

    let encoded_form_data = serde_urlencoded::to_string(form_data).map_err(|err| {
        Error::new(
            ErrorKind::CreateHttpRequest,
            format!("Failed to create http request for oauth token: {}", err),
        )
    })?;

    let url: hyper::Uri = token_url.as_ref().parse().map_err(|_| {
        Error::new(
            ErrorKind::BadConfig,
            "Failed to parse token url from config",
        )
    })?;

    let request = Request::builder()
        .uri(url)
        .method("POST")
        .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
        .body(Body::from(encoded_form_data))
        .map_err(|_| {
            Error::new(
                ErrorKind::CreateHttpRequest,
                "Failed to create http request to request oauth token",
            )
        })?;

    let token_response = http_client.request(request).await.map_err(|err| {
        Error::new(
            ErrorKind::InternalError,
            format!("Failed to request oauth access token: {}", err),
        )
    })?;

    // println!("{}", String::from_utf8(token_response.clone()).unwrap());

    let access_token_response: AccessTokenResponse = parse_json_from_slice(&token_response)
        .map_err(|err| {
            Error::new(
                ErrorKind::Parse,
                format!("Invalid response when fetching oauth access token: {}", err),
            )
        })?;

    Ok(access_token_response)
}

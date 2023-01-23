use reqwest::blocking::Client as HttpClient;

use crate::types;

pub struct Client {
    http_client: HttpClient,
}

impl Client {
    pub fn new() -> Self {
        let http_client = HttpClient::new();
        Self { http_client }
    }

    pub fn get<S: Into<String>>(&self, uri: S) -> types::Result<String> {
        let response = self.http_client.get(uri.into()).send().map_err(|e| {
            types::Error::new(
                types::ErrorKind::Http,
                format!("Failed to send request: {}", e),
            )
        })?;

        let is_success = response.status().is_success();

        let bytes = response.bytes().map_err(|e| {
            types::Error::new(
                types::ErrorKind::Http,
                format!("Failed to parse response: {}", e),
            )
        })?;

        let body = String::from_utf8_lossy(&bytes).to_string();

        if !is_success {
            return Err(types::Error::new(
                types::ErrorKind::Http,
                format!("Http request failed: {}", body),
            ));
        } else {
            return Ok(body);
        };
    }
}

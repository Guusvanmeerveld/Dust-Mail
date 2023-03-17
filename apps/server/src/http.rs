use hyper::{body, client::HttpConnector, Body, Client, Request};
use hyper_tls::HttpsConnector;

use crate::types::{Error, ErrorKind, Result};

pub struct HttpClient {
    client: Client<HttpConnector>,
    client_tls: Client<HttpsConnector<HttpConnector>>,
}

impl HttpClient {
    pub fn new() -> Self {
        let http_connector = HttpConnector::new();
        let client = Client::builder().build(http_connector);

        let https_connector = HttpsConnector::new();
        let client_tls = Client::builder().build(https_connector);

        Self { client, client_tls }
    }
    pub async fn request(&self, req: Request<Body>) -> Result<Vec<u8>> {
        let secure = match req.uri().scheme() {
            Some(scheme) => scheme.as_str() == "https",
            None => {
                return Err(Error::new(
                    ErrorKind::CreateHttpRequest,
                    "Missing request scheme",
                ))
            }
        };

        let response_result = if secure {
            self.client_tls.request(req).await
        } else {
            self.client.request(req).await
        };

        let response = response_result.map_err(|err| {
            Error::new(
                ErrorKind::CreateHttpRequest,
                format!("Failed to create http request: {}", err),
            )
        })?;

        let body = body::to_bytes(response.into_body()).await.map_err(|err| {
            Error::new(
                ErrorKind::CreateHttpRequest,
                format!("Failed to read response body in http request: {}", err),
            )
        })?;

        Ok(Vec::from(body))
    }
}

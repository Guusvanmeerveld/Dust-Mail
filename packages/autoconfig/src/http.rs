use reqwest::blocking::Client as HttpClient;

use crate::types;

/// The accepted content types for an xml response
const XML_CONTENT_TYPE: (&[u8; 15], &[u8; 8]) = (b"application/xml", b"text/xml");

pub struct Client {
    http_client: HttpClient,
}

impl Client {
    pub fn new() -> Self {
        let http_client = HttpClient::new();
        Self { http_client }
    }

    /// Fetches a given url and returns the XML response (if there is one)
    fn get<S: Into<String>>(&self, uri: S) -> types::Result<String> {
        let response = self.http_client.get(uri.into()).send().map_err(|e| {
            types::Error::new(
                types::ErrorKind::Http,
                format!("Failed to send request: {}", e),
            )
        })?;

        // Get the Content-Type header, error if it doesn't exist
        let content_type = match response.headers().get("content-type") {
            Some(header) => header,
            None => {
                return Err(types::Error::new(
                    types::ErrorKind::Http,
                    "Server did not include a content-type header in response",
                ))
            }
        };

        let content_type_bytes = content_type.as_bytes();

        // Ensure the content type is XML
        if !(content_type_bytes.starts_with(XML_CONTENT_TYPE.0)
            || content_type_bytes.starts_with(XML_CONTENT_TYPE.1))
        {
            return Err(types::Error::new(
                types::ErrorKind::Http,
                "Server did not respond with xml content",
            ));
        }

        let is_success = response.status().is_success();

        // Get the http message body
        let bytes = response.bytes().map_err(|e| {
            types::Error::new(
                types::ErrorKind::Http,
                format!("Failed to get http message body: {}", e),
            )
        })?;

        // Convert the body to a string
        let body = String::from_utf8_lossy(&bytes).to_string();

        // If we got an error response we return an error
        if !is_success {
            return Err(types::Error::new(
                types::ErrorKind::Http,
                format!("Http request failed: {}", body),
            ));
        } else {
            return Ok(body);
        };
    }

    pub fn request_urls(&self, urls: Vec<String>) -> Option<String> {
        // Fetch every given url
        for url in urls {
            match self.get(url) {
                Ok(response) => return Some(response),
                Err(_) => {}
            }
        }

        // Return nothing if all of the requests failed
        return None;
    }
}

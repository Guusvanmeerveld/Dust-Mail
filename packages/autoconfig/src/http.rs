use std::time::Duration;

use crate::types::{Error, ErrorKind, Result};

use futures::future::join_all;
use reqwest::{redirect, Client as HttpClient};

pub struct Client {
    client: HttpClient,
}

impl Client {
    const TIMEOUT: Duration = Duration::from_secs(10);
    const MAX_REDIRECTS: usize = 10;
    /// The accepted content types for an xml response
    const XML_CONTENT_TYPE: (&str, &str) = ("application/xml", "text/xml");

    pub fn new() -> Result<Self> {
        let redirect_policy = redirect::Policy::limited(Self::MAX_REDIRECTS);

        let client = HttpClient::builder()
            .timeout(Self::TIMEOUT)
            .redirect(redirect_policy)
            .build()?;

        Ok(Self { client })
    }

    /// Fetches a given url and returns the XML response (if there is one)
    async fn get_xml<S: Into<String>>(&self, uri: S) -> Result<String> {
        let response = self.client.get(uri.into()).send().await?;

        // Get the Content-Type header, error if it doesn't exist
        let content_type = match response.headers().get("content-type") {
            Some(header) => header.to_str().map_err(|_| {
                Error::new(
                    ErrorKind::InvalidResponse,
                    "Content-Type header does not contain valid characters",
                )
            })?,
            None => {
                return Err(Error::new(
                    ErrorKind::InvalidResponse,
                    "Server did not include a content-type header in response",
                ))
            }
        };

        // Ensure the content type is XML
        if !(content_type.starts_with(Self::XML_CONTENT_TYPE.0)
            || content_type.starts_with(Self::XML_CONTENT_TYPE.1))
        {
            return Err(Error::new(
                ErrorKind::InvalidResponse,
                "Server did not respond with xml content",
            ));
        }

        let is_success = response.status().is_success();

        // Get the http message body
        let bytes = response.bytes().await?;

        // Convert the body to a string
        let body = String::from_utf8(bytes.to_vec())
            .map_err(|_| Error::new(ErrorKind::InvalidResponse, "Response is not valid utf-8"))?;

        // If we got an error response we return an error
        if !is_success {
            return Err(Error::new(
                ErrorKind::InvalidResponse,
                format!("Http request failed: {}", body),
            ));
        } else {
            return Ok(body);
        };
    }

    pub async fn request_urls(&self, urls: Vec<String>) -> Option<String> {
        let request_futures = urls.into_iter().map(|url| self.get_xml(url));

        let results = join_all(request_futures).await;

        for result in results {
            match result {
                Ok(response) => return Some(response),
                Err(_) => {}
            }
        }

        // Return nothing if all of the requests failed
        return None;
    }
}

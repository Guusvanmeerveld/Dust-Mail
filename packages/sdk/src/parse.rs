use std::collections::HashMap;

use mailparse::parse_mail;

use crate::{
    client::Headers,
    types::{self, Content},
    utils::map_mailparse_error,
};

pub fn parse_rfc822(body: &[u8]) -> types::Result<Content> {
    let parsed = parse_mail(body).map_err(map_mailparse_error)?;

    let mut text: Option<String> = None;
    let mut html: Option<String> = None;

    for part in parsed.parts() {
        let headers = part.get_headers();

        for header in headers {
            let key = header.get_key().to_ascii_lowercase();

            if key == "content-type" {
                let value = header.get_value().to_ascii_lowercase();

                let body = Some(part.get_body().map_err(map_mailparse_error)?);

                if value.starts_with("text/plain") {
                    text = body
                } else if value.starts_with("text/html") {
                    html = body
                }
            }
        }
    }

    Ok(Content { html, text })
}

pub fn parse_headers(response: &[u8]) -> types::Result<Headers> {
    let (parsed, _) = mailparse::parse_headers(response).map_err(map_mailparse_error)?;

    let mut headers: Headers = HashMap::new();

    for header in parsed.into_iter() {
        match headers.insert(header.get_key(), header.get_value()) {
            _ => {}
        }
    }

    Ok(headers)
}

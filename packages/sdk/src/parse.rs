use std::collections::HashMap;

#[cfg(feature = "pop")]
use pop3::types::ErrorKind as PopErrorKind;

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

#[cfg(feature = "pop")]
pub fn map_pop_error(error: pop3::types::Error) -> types::Error {
    let kind: types::ErrorKind = match error.kind() {
        PopErrorKind::Server => types::ErrorKind::Server,
        PopErrorKind::Connection => types::ErrorKind::Connection,
        PopErrorKind::Read => types::ErrorKind::Read,
        PopErrorKind::Write => types::ErrorKind::Write,
        PopErrorKind::Tls => types::ErrorKind::Security,
        PopErrorKind::State => types::ErrorKind::UnexpectedBehavior,
    };

    types::Error::new(kind, error)
}

pub fn map_parse_date_error(error: chrono::ParseError) -> types::Error {
    types::Error::new(
        types::ErrorKind::Read,
        format!("Error parsing date from message: {}", error),
    )
}

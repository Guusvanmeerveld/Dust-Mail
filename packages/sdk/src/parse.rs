use std::{
    collections::HashMap,
    net::{SocketAddr, ToSocketAddrs},
};

use mailparse::parse_mail;
use serde::Serialize;

use crate::{
    types::{self, Content, Headers},
    utils::map_mailparse_error,
};

/// Parse an RFC 822 body to an appropriate and useful struct.
pub fn parse_rfc822(body: &[u8]) -> types::Result<Content> {
    let parsed = parse_mail(body).map_err(map_mailparse_error)?;

    let mut text: Option<String> = None;
    let mut html: Option<String> = None;

    for part in parsed.parts() {
        let headers = part.get_headers();

        for header in headers {
            let key = header.get_key_ref().to_ascii_lowercase();

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

    Ok(Content::new(text, html))
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
    types::Error::new(
        types::ErrorKind::PopError(error),
        "An error occured with the Pop server",
    )
}

#[cfg(feature = "imap")]
pub fn map_imap_error(error: imap::Error) -> types::Error {
    types::Error::new(
        types::ErrorKind::ImapError,
        format!("Error from Imap server: {}", error),
    )
}

pub fn map_parse_date_error(error: chrono::ParseError) -> types::Error {
    types::Error::new(
        types::ErrorKind::ParseDate,
        format!("Error parsing date from message: {}", error),
    )
}

pub fn from_socket_address<A: ToSocketAddrs>(addr: A) -> types::Result<SocketAddr> {
    Ok(addr
        .to_socket_addrs()
        .map_err(|e| {
            types::Error::new(
                types::ErrorKind::ParseAddress,
                format!("Failed to parse given address: {}", e),
            )
        })?
        .next()
        .unwrap())
}

pub fn to_json<T: ?Sized + Serialize>(value: &T) -> types::Result<String> {
    serde_json::to_string(value).map_err(|e| {
        types::Error::new(
            types::ErrorKind::SerializeJSON,
            format!("Failed to serialize data to json: {}", e),
        )
    })
}

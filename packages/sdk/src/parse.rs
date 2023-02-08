use std::{
    collections::HashMap,
    net::{SocketAddr, ToSocketAddrs},
};

use mailparse::parse_mail;
use serde::Serialize;

use mailparse::MailParseError;

use crate::types::{self, Content, Headers};

const ALLOWED_HTML_TAGS: [&str; 71] = [
    "address",
    "article",
    "aside",
    "footer",
    "header",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hgroup",
    "main",
    "nav",
    "section",
    "blockquote",
    "dd",
    "div",
    "dl",
    "dt",
    "figcaption",
    "figure",
    "hr",
    "li",
    "main",
    "ol",
    "p",
    "pre",
    "ul",
    "a",
    "abbr",
    "b",
    "bdi",
    "bdo",
    "br",
    "cite",
    "code",
    "data",
    "dfn",
    "em",
    "i",
    "kbd",
    "mark",
    "q",
    "rb",
    "rp",
    "rt",
    "rtc",
    "ruby",
    "s",
    "samp",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "time",
    "u",
    "var",
    "wbr",
    "caption",
    "col",
    "colgroup",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "center",
];

const GENERIC_HTML_ATTRIBUTES: [&str; 12] = [
    "style",
    "width",
    "height",
    "border",
    "cellspacing",
    "cellpadding",
    "colspan",
    "id",
    "target",
    "data-x-style-url",
    "class",
    "align",
];

fn sanitize_html(dirty: &str) -> String {
    let clean = ammonia::Builder::new()
        .add_tags(ALLOWED_HTML_TAGS)
        .add_generic_attributes(GENERIC_HTML_ATTRIBUTES)
        .clean(dirty)
        .to_string();

    clean
}

fn sanitize_text(dirty: &str) -> String {
    ammonia::clean_text(dirty)
}

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
                    text = match body {
                        Some(body_data) => Some(sanitize_text(&body_data)),
                        None => None,
                    }
                } else if value.starts_with("text/html") {
                    html = match body {
                        Some(body_data) => Some(sanitize_html(&body_data)),
                        None => None,
                    }
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

pub fn map_mailparse_error(error: MailParseError) -> types::Error {
    types::Error::new(
        types::ErrorKind::ParseMessage,
        format!("Failed to read message from server: {}", error),
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

use crate::types::{Error, ErrorKind, Result};

pub fn create_mail_parse_error() -> Error {
    Error::new(ErrorKind::Parse, "Failed to parse email address")
}

pub fn get_domain_from_email<'a>(email: &'a str) -> Result<&'a str> {
    let mut email_split = email.split('@');

    match email_split.next() {
        Some(_) => {}
        None => return Err(create_mail_parse_error()),
    };

    match email_split.next() {
        Some(domain) => Ok(domain),
        None => Err(create_mail_parse_error()),
    }
}

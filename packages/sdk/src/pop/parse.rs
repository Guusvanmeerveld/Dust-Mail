use chrono::DateTime;

use crate::types::{Address, Flag, Headers, Result};

pub fn parse_address(address_list: &str) -> Vec<Address> {
    let split = address_list.split(",\r\t");

    let mut addresses: Vec<Address> = Vec::new();

    // TODO: Parse pop addressess
    for address in split {}

    // todo!()

    addresses
}

pub fn parse_preview_from_headers(
    headers: &Headers,
) -> Result<(Vec<Address>, Vec<Flag>, Option<i64>, Option<String>)> {
    let subject = headers.get("Subject").cloned();

    let sent = match headers.get("Date") {
        Some(date) => {
            let datetime = DateTime::parse_from_rfc2822(date.trim())?;

            Some(datetime.timestamp())
        }
        None => None,
    };

    let from = match headers.get("From") {
        Some(from) => parse_address(from),
        None => Vec::new(),
    };

    // There is also no support for flags in Pop, so we mark every message as read by default.
    let flags = vec![Flag::Read];

    Ok((from, flags, sent, subject))
}

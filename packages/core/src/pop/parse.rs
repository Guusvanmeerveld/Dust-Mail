use std::collections::HashMap;

use mailparse::parse_mail;

use crate::{
    types::{self, Address},
    utils::map_mailparse_error,
};

pub type Headers = HashMap<String, String>;

pub fn parse_address(address_list: String) -> Vec<Address> {
    let split = address_list.split(",\r\t");

    let mut addresses: Vec<Address> = Vec::new();

    for address in split {}

    addresses
}

pub fn parse_headers(response: Vec<u8>) -> types::Result<Headers> {
    let parsed = match parse_mail(&response).map_err(map_mailparse_error) {
        Ok(parsed) => parsed,
        Err(err) => return Err(err),
    };

    let mut headers: Headers = HashMap::new();

    for header in parsed.get_headers().into_iter() {
        match headers.insert(header.get_key(), header.get_value()) {
            _ => {}
        }
    }

    Ok(headers)
}

use std::{collections::HashMap, env};

use dotenv::dotenv;
use mailparse::MailParseError;

use crate::types;

pub fn get_env() -> HashMap<String, String> {
    dotenv().ok();

    let mut map = HashMap::new();

    let vars = env::vars();

    for var in vars {
        match map.insert(var.0, var.1) {
            _ => {}
        };
    }

    map
}

pub fn map_mailparse_error(error: MailParseError) -> types::Error {
    types::Error::new(
        types::ErrorKind::Read,
        format!("Failed to read message from server: {}", error),
    )
}

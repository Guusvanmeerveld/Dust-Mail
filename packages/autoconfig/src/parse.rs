use crate::types::{self, config::Config};

use serde_xml_rs;

pub fn from_str(string: &str) -> types::Result<Config> {
    let config: Config = serde_xml_rs::from_str(string)
        .map_err(|e| types::Error::new(types::ErrorKind::Parse, e.to_string()))?;

    Ok(config)
}

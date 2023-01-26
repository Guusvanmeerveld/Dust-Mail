use base64::Engine;

use crate::types::{Error, ErrorKind, Result};

const BASE64_ENGINE: base64::engine::GeneralPurpose = base64::engine::GeneralPurpose::new(
    &base64::alphabet::URL_SAFE,
    base64::engine::general_purpose::NO_PAD,
);

/// Encode an array of bytes to a base64-encoded string
pub fn encode(data: &[u8]) -> String {
    BASE64_ENGINE.encode(data)
}

/// Decode a base64-encoded array of bytes to an array of utf-8 encoded bytes
pub fn decode(data: &[u8]) -> Result<Vec<u8>> {
    BASE64_ENGINE.decode(data).map_err(|e| {
        Error::new(
            ErrorKind::DecodeBase64,
            format!("Failed to decode base64: {}", e),
        )
    })
}

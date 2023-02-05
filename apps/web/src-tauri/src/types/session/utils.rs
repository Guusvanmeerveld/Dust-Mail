use crate::{
    base64, cryptography,
    files::CacheFile,
    types::{Error, ErrorKind, LoginOptions, Result},
};

/// Given a token, get the encryption nonce and key.
pub fn get_nonce_and_key_from_token(token: &str) -> Result<(String, String)> {
    let mut split = token.split(':');

    let nonce_base64 = match split.next() {
        Some(key) => key.to_string(),
        None => {
            return Err(Error::new(
                ErrorKind::InvalidToken,
                "Token is missing a nonce",
            ))
        }
    };

    let key_base64 = match split.next() {
        Some(key) => key.to_string(),
        None => {
            return Err(Error::new(
                ErrorKind::InvalidToken,
                "Token is missing a key",
            ))
        }
    };

    Ok((key_base64, nonce_base64))
}

/// Given a token, find the corresponding encrypted login credentials in the cache dir and return them.
pub fn get_login_options(token: &str) -> Result<Vec<LoginOptions>> {
    let (key_base64, nonce_base64) = get_nonce_and_key_from_token(token)?;

    let key = base64::decode(key_base64.as_bytes())?;
    let nonce = base64::decode(nonce_base64.as_bytes())?;

    let mut encrypted: Vec<u8> = Vec::new();

    let cache = CacheFile::from_session_name(nonce_base64);

    match cache.read(&mut encrypted) {
        Ok(_) => {}
        Err(_) => {
            return Err(Error::new(
                ErrorKind::NotLoggedIn,
                "Could not find login credentials, please login",
            ));
        }
    };

    let decrypted = cryptography::decrypt(&encrypted, &key, &nonce)?;

    let login_options: Vec<LoginOptions> = serde_json::from_slice(&decrypted).map_err(|e| {
        Error::new(
            ErrorKind::DeserializeJSON,
            format!("Could not deserialize encrypted login info {}", e),
        )
    })?;

    Ok(login_options)
}

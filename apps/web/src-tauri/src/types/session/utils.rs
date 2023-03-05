use sdk::session::Credentials;

use crate::{
    base64, cryptography,
    files::CacheFile,
    types::{Error, ErrorKind, Result}, parse,
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
pub fn get_credentials(token: &str) -> Result<Credentials> {
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

    let login_options: Credentials = serde_json::from_slice(&decrypted).map_err(|e| {
        Error::new(
            ErrorKind::DeserializeJSON,
            format!("Could not deserialize encrypted login info {}", e),
        )
    })?;

    Ok(login_options)
}

pub fn generate_token(credentials: &Credentials) -> Result<String> {
    // Serialize the given options to json
    let options_json = parse::to_json(credentials)?;

    // Generate a key and nonce to sign the options
    let key = cryptography::generate_key();
    let nonce = cryptography::generate_nonce();

    // Crypographically sign the login options.
    let encrypted = cryptography::encrypt(&options_json, &key, &nonce)?;

    // Convert the key and nonce to base64
    let nonce_base64 = base64::encode(&nonce);
    let key_base64 = base64::encode(&key);

    let cache = CacheFile::from_session_name(&nonce_base64);

    // Write to file cache so the credentials are still available when the program restarts.
    cache.write(&encrypted)?;

    let token: String = format!("{}:{}", nonce_base64, key_base64);

    Ok(token)
}

use chacha20poly1305::{
    aead::{rand_core::RngCore, Aead, OsRng},
    KeyInit, XChaCha20Poly1305,
};

use crate::types::{Error, ErrorKind, Result};

pub fn generate_key() -> [u8; 32] {
    let mut key = [0u8; 32];

    OsRng.fill_bytes(&mut key);

    key
}

pub fn generate_nonce() -> [u8; 24] {
    let mut nonce = [0u8; 24];

    OsRng.fill_bytes(&mut nonce);

    nonce
}

pub fn encrypt(data: &[u8], key: &[u8; 32], nonce: &[u8; 24]) -> Result<Vec<u8>> {
    let cipher = XChaCha20Poly1305::new(key.into());

    let encrypted = cipher
        .encrypt(nonce.into(), data)
        .map_err(|e| Error::new(ErrorKind::Crypto, format!("Failed to encrypt data: {}", e)))?;

    Ok(encrypted)
}

pub fn decrypt(data: &[u8], key: &[u8], nonce: &[u8]) -> Result<Vec<u8>> {
    let cipher = XChaCha20Poly1305::new(key.into());

    let decrypted = cipher
        .decrypt(nonce.into(), data)
        .map_err(|e| Error::new(ErrorKind::Crypto, format!("Failed to decrypt data: {}", e)))?;

    Ok(decrypted)
}

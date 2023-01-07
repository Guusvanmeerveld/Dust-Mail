use native_tls::TlsConnector;

use crate::types;

fn map_native_tls_error(error: native_tls::Error) -> types::Error {
    types::Error::new(
        types::ErrorKind::Security,
        format!("Error creating a secure connection: {}", error),
    )
}

pub fn create_tls_connector() -> types::Result<TlsConnector> {
    native_tls::TlsConnector::builder()
        .build()
        .map_err(map_native_tls_error)
}

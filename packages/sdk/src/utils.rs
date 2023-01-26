use std::{
    net::{TcpStream, ToSocketAddrs},
    time::Duration,
};

#[cfg(test)]
use std::{collections::HashMap, env};

#[cfg(test)]
use dotenv::dotenv;

use mailparse::MailParseError;
use native_tls::TlsStream;

use crate::{parse, tls, types};

#[cfg(test)]
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
        types::ErrorKind::ParseMessage,
        format!("Failed to read message from server: {}", error),
    )
}

pub fn create_tcp_stream<A: ToSocketAddrs>(addr: A) -> types::Result<TcpStream> {
    let default_connection_timeout = Duration::from_secs(30);

    let addr = parse::from_socket_address(addr)?;

    TcpStream::connect_timeout(&addr, default_connection_timeout).map_err(|e| {
        types::Error::new(
            types::ErrorKind::Connect,
            format!("Failed to connect to server: {}", e.to_string()),
        )
    })
}

pub fn create_tls_stream<A: ToSocketAddrs>(
    addr: A,
    domain: &str,
) -> types::Result<TlsStream<TcpStream>> {
    let tcp_stream = create_tcp_stream(addr)?;

    let tls = tls::create_tls_connector()?;

    tls.connect(domain, tcp_stream).map_err(|e| {
        types::Error::new(
            types::ErrorKind::SecureConnection,
            format!("Failed to create a secure connection: {}", e.to_string()),
        )
    })
}

use std::{
    net::{TcpStream, ToSocketAddrs},
    time::Duration,
};

use native_tls::TlsStream;

use crate::{parse, tls, types};

pub fn create_tcp_stream<A: ToSocketAddrs>(
    addr: A,
    connect_timeout: Option<Duration>,
) -> types::Result<TcpStream> {
    let default_connection_timeout = Duration::from_secs(30);

    let addr = parse::from_socket_address(addr)?;

    TcpStream::connect_timeout(
        &addr,
        connect_timeout.unwrap_or_else(|| default_connection_timeout),
    )
    .map_err(|e| {
        types::Error::new(
            types::ErrorKind::Connect,
            format!(
                "Failed to connect to server {} on port {}: {}",
                addr.ip(),
                addr.port(),
                e.to_string()
            ),
        )
    })
}

pub fn create_tls_stream<A: ToSocketAddrs>(
    addr: A,
    domain: &str,
    connect_timeout: Option<Duration>,
) -> types::Result<TlsStream<TcpStream>> {
    let tcp_stream = create_tcp_stream(addr, connect_timeout)?;

    let tls = tls::create_tls_connector()?;

    tls.connect(domain, tcp_stream).map_err(|e| {
        types::Error::new(
            types::ErrorKind::SecureConnection,
            format!("Failed to create a secure connection: {}", e.to_string()),
        )
    })
}

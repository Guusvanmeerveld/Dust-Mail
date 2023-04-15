use std::time::Duration;

use async_native_tls::TlsConnector;
use async_tcp::{types::ErrorKind as TcpErrorKind, Config as TcpConfig, TcpClient};
use futures::{future::select_ok, FutureExt};
use tokio::{
    io::{AsyncRead, AsyncWrite},
    net::ToSocketAddrs,
};

use crate::types::{ConnectionSecurity, Error, ErrorKind, Result};

use super::types::{ServerConfigType, Socket};
// TODO: Make all of these functions use a singular socket instead of each creating their own connection.

/// Checks if a given connection is connected to an SMTP supporting server.
#[cfg(feature = "smtp")]
async fn is_smtp<S: AsyncRead + AsyncWrite + Unpin>(mut client: TcpClient<S>) -> Result<bool> {
    // Read greeting
    let greeting = client.read_response().await?;

    client.close().await?;

    let greeting = greeting.trim().to_ascii_lowercase();

    let is_smtp = greeting.contains("smtp") || greeting.contains("esmtp");

    Ok(is_smtp)
}

/// Checks if a given connection is connected to an IMAP supporting server.
#[cfg(feature = "imap")]
async fn is_imap<S: AsyncRead + AsyncWrite + Unpin>(mut client: TcpClient<S>) -> Result<bool> {
    // Read greeting
    client.read_response().await?;

    let response = client.send_command("A0001 CAPABILITY").await?;

    client.close().await?;

    let response = response.trim().to_ascii_lowercase();

    let is_imap = response
        .split(' ')
        .find(|capability| capability == &"imap4rev1")
        .is_some();

    Ok(is_imap)
}

#[cfg(feature = "imap")]
async fn check_for_imap<T: ToSocketAddrs, S: AsRef<str>>(
    security: &ConnectionSecurity,
    addr: &T,
    domain: S,
    tcp_config: &Option<TcpConfig>,
) -> Result<ServerConfigType> {
    let is_imap = match security {
        ConnectionSecurity::Tls => {
            let connection = async_tcp::connect(&addr, domain, tcp_config.clone()).await?;

            is_imap(connection).await?
        }
        _ => {
            let connection = async_tcp::connect_plain(&addr, tcp_config.clone()).await?;

            is_imap(connection).await?
        }
    };

    if is_imap {
        Ok(ServerConfigType::Imap)
    } else {
        Err(Error::new(
            ErrorKind::ConfigNotFound,
            "Given server is not an imap server",
        ))
    }
}

#[cfg(feature = "smtp")]
async fn check_for_smtp<T: ToSocketAddrs, S: AsRef<str>>(
    security: &ConnectionSecurity,
    addr: &T,
    domain: S,
    tcp_config: &Option<TcpConfig>,
) -> Result<ServerConfigType> {
    let is_smtp = match security {
        ConnectionSecurity::Tls => {
            let connection = async_tcp::connect(&addr, domain, tcp_config.clone()).await?;

            is_smtp(connection).await?
        }
        _ => {
            let connection = async_tcp::connect_plain(&addr, tcp_config.clone()).await?;

            is_smtp(connection).await?
        }
    };

    if is_smtp {
        Ok(ServerConfigType::Smtp)
    } else {
        Err(Error::new(
            ErrorKind::ConfigNotFound,
            "Given server is not an smtp server",
        ))
    }
}

#[cfg(feature = "pop")]
async fn check_for_pop<T: ToSocketAddrs, S: AsRef<str>>(
    security: &ConnectionSecurity,
    addr: &T,
    domain: S,
    tcp_config: &Option<TcpConfig>,
) -> Result<ServerConfigType> {
    let tcp_config = tcp_config.as_ref().cloned().unwrap_or_default();

    let connection_timeout = Some(tcp_config.into_timeout());

    // The async-pop package checks the greeting for us when we call the connect function, so we don't have to do it ourselves.
    let is_pop = match security {
        ConnectionSecurity::Tls => {
            let tls = TlsConnector::new();

            async_pop3::connect(&addr, domain.as_ref(), &tls, connection_timeout)
                .await
                .is_ok()
        }
        _ => async_pop3::connect_plain(&addr, connection_timeout)
            .await
            .is_ok(),
    };

    if is_pop {
        Ok(ServerConfigType::Pop)
    } else {
        Err(Error::new(
            ErrorKind::ConfigNotFound,
            "Given server is not a pop server",
        ))
    }
}

/// Fetch the service type from a given server address. e.g I have a server at 192.168.0.1:993, this function could tell me that it is an Imap server.
///
/// This function is needed because, for example we can never assume that a service running on port 993 is an Imap server, even though that would be the expected behavior.
pub async fn detect_server_config(socket: &Socket) -> Result<Option<ServerConfigType>> {
    let addr = socket.addr();
    let domain = socket.domain();

    let security = socket.security();

    let connect_timeout = Duration::from_millis(5 * 1000);

    let tcp_config = Some(TcpConfig::new(connect_timeout, true));

    let mut checkers = Vec::new();

    #[cfg(feature = "imap")]
    {
        let check_for_imap_future = check_for_imap(security, &addr, domain, &tcp_config);

        checkers.push(check_for_imap_future.boxed());
    }

    #[cfg(feature = "pop")]
    {
        let check_for_smtp_future = check_for_pop(security, &addr, domain, &tcp_config);

        checkers.push(check_for_smtp_future.boxed());
    }

    #[cfg(feature = "smtp")]
    {
        let check_for_smtp_future = check_for_smtp(security, &addr, domain, &tcp_config);

        checkers.push(check_for_smtp_future.boxed());
    }

    let result = select_ok(checkers).await;

    match result {
        Ok((config_type, _remaining)) => Ok(Some(config_type)),
        Err(err) => match err.kind() {
            ErrorKind::Tcp(tcp_err) => match tcp_err.kind() {
                TcpErrorKind::Timeout(_) => Ok(None),
                _ => Err(err),
            },
            _ => Err(err),
        },
    }
}

#[cfg(test)]
mod test {
    use crate::{
        detect::{types::ServerConfigType, Socket},
        types::ConnectionSecurity,
    };

    use super::detect_server_config;

    #[tokio::test]
    async fn client_type() {
        let domain = "mail.samtaen.nl";
        let imap_port = 993;
        let smtp_port = 587;
        let pop_port = 995;

        #[cfg(feature = "imap")]
        {
            assert_eq!(
                detect_server_config(&Socket::new(domain, imap_port, ConnectionSecurity::Tls))
                    .await
                    .unwrap(),
                Some(ServerConfigType::Imap),
            );

            assert_ne!(
                detect_server_config(&Socket::new(domain, pop_port, ConnectionSecurity::Tls))
                    .await
                    .unwrap(),
                Some(ServerConfigType::Imap),
            );
        }

        #[cfg(feature = "pop")]
        {
            assert_eq!(
                detect_server_config(&Socket::new(domain, pop_port, ConnectionSecurity::Tls))
                    .await
                    .unwrap(),
                Some(ServerConfigType::Pop),
            );

            assert_ne!(
                detect_server_config(&Socket::new(domain, imap_port, ConnectionSecurity::Tls))
                    .await
                    .unwrap(),
                Some(ServerConfigType::Pop),
            );
        }

        #[cfg(feature = "smtp")]
        {
            assert_eq!(
                detect_server_config(&Socket::new(
                    domain,
                    smtp_port,
                    ConnectionSecurity::StartTls
                ))
                .await
                .unwrap(),
                Some(ServerConfigType::Smtp),
            );

            assert_ne!(
                detect_server_config(&Socket::new(domain, imap_port, ConnectionSecurity::Tls))
                    .await
                    .unwrap(),
                Some(ServerConfigType::Smtp),
            );
        }
    }
}

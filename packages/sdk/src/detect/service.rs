use std::{
    io::{Read, Write},
    time::Duration,
};

#[cfg(feature = "imap")]
use {bufstream::BufStream, std::io::BufRead};

#[cfg(feature = "pop")]
use crate::parse::map_pop_error;

use crate::{
    tls::create_tls_connector,
    types::{self, ConnectionSecurity},
    utils::{create_tcp_stream, create_tls_stream},
};

use super::types::ServerConfigType;

const IMAP_GREETING: &str = "* ok";

/// This function assumes the given stream is a freshly opened connection
fn detect_from_stream<S: Read + Write + BufRead>(
    stream: &mut S,
) -> types::Result<Option<ServerConfigType>> {
    let mut response = String::new();

    stream
        .read_line(&mut response)
        .map_err(|e| types::Error::new(types::ErrorKind::ImapError, e.to_string()))?;

    response.make_ascii_lowercase();

    let config_type = if response.starts_with(IMAP_GREETING) {
        Some(ServerConfigType::Imap)
    } else if response.contains("imap") {
        Some(ServerConfigType::Imap)
    } else if response.contains("smtp") {
        Some(ServerConfigType::Smtp)
    } else {
        None
    };

    Ok(config_type)
}

/// Fetch the service type from a given server address. e.g I have a server at 192.168.0.1:993, this function could tell me that it is an Imap server.
///
/// This function is needed because, for example we can never assume that a service running on port 993 is an Imap server, even though that would be the expected behavior.
pub fn from_server(
    domain: &str,
    port: &u16,
    security: &ConnectionSecurity,
) -> types::Result<Option<ServerConfigType>> {
    let addr = (domain, *port);

    let connect_timeout = Some(Duration::from_millis(2500));

    #[cfg(feature = "imap")]
    {
        let is_imap = match security {
            ConnectionSecurity::Tls => {
                let tls_stream = create_tls_stream(addr, domain, connect_timeout)?;

                let mut bufstream = BufStream::new(tls_stream);

                detect_from_stream(&mut bufstream)? == Some(ServerConfigType::Imap)
            }
            _ => {
                let tcp_stream = create_tcp_stream(addr, connect_timeout)?;

                let mut bufstream = BufStream::new(tcp_stream);

                detect_from_stream(&mut bufstream)? == Some(ServerConfigType::Imap)
            }
        };

        if is_imap {
            return Ok(Some(ServerConfigType::Imap));
        }
    }
    #[cfg(feature = "pop")]
    {
        let is_pop = match security {
            ConnectionSecurity::Tls => {
                let tls = create_tls_connector()?;

                pop3::connect(addr, domain, &tls, connect_timeout)
                    .map_err(map_pop_error)
                    .is_ok()
            }
            _ => pop3::connect_plain(addr, connect_timeout)
                .map_err(map_pop_error)
                .is_ok(),
        };

        if is_pop {
            return Ok(Some(ServerConfigType::Pop));
        }
    }
    #[cfg(feature = "smtp")]
    {
        let is_smtp = match security {
            ConnectionSecurity::Tls => {
                let tls_stream = create_tls_stream(addr, domain, connect_timeout)?;

                let mut bufstream = BufStream::new(tls_stream);

                detect_from_stream(&mut bufstream)? == Some(ServerConfigType::Smtp)
            }
            _ => {
                let tcp_stream = create_tcp_stream(addr, connect_timeout)?;

                let mut bufstream = BufStream::new(tcp_stream);

                detect_from_stream(&mut bufstream)? == Some(ServerConfigType::Smtp)
            }
        };

        if is_smtp {
            return Ok(Some(ServerConfigType::Smtp));
        }
    }

    Ok(None)
}

#[cfg(test)]
mod test {
    use crate::{detect::types::ServerConfigType, types::ConnectionSecurity};

    use super::from_server;

    #[test]
    fn client_type() {
        let domain = "outlook.office365.com";
        let imap_port = 993;
        let smtp_port = 587;
        let pop_port = 995;

        #[cfg(feature = "imap")]
        {
            assert_eq!(
                from_server(domain, &imap_port, &ConnectionSecurity::Tls).unwrap(),
                Some(ServerConfigType::Imap),
            );

            assert_ne!(
                from_server(domain, &pop_port, &ConnectionSecurity::Tls).unwrap(),
                Some(ServerConfigType::Imap),
            );
        }

        #[cfg(feature = "pop")]
        {
            assert_eq!(
                from_server(domain, &pop_port, &ConnectionSecurity::Tls).unwrap(),
                Some(ServerConfigType::Pop),
            );

            assert_ne!(
                from_server(domain, &imap_port, &ConnectionSecurity::Tls).unwrap(),
                Some(ServerConfigType::Pop),
            );
        }

        #[cfg(feature = "imap")]
        {
            assert_eq!(
                from_server(domain, &smtp_port, &ConnectionSecurity::StartTls).unwrap(),
                Some(ServerConfigType::Smtp),
            );

            assert_ne!(
                from_server(domain, &imap_port, &ConnectionSecurity::Tls).unwrap(),
                Some(ServerConfigType::Smtp),
            );
        }
    }
}

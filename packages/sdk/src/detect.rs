use std::net::{TcpStream, ToSocketAddrs};

#[cfg(feature = "imap")]
use crate::imap::map_imap_error;
#[cfg(feature = "imap")]
use imap;

#[cfg(feature = "pop")]
use crate::pop::map_pop_error;

use crate::{client::ConnectionSecurity, tls::create_tls_connector, types, ClientType};

const AT_SYMBOL: char = '@';

pub struct ServiceDetector {}

impl ServiceDetector {
    pub fn detect_config<A: Into<String>>(email_address: A) -> types::Result<()> {
        let email_address: String = email_address.into();

        if !email_address.contains(AT_SYMBOL) {
            Err(types::Error::new(
                types::ErrorKind::Input,
                "An email address must have an '@' symbol in it",
            ))
        } else {
            let mut split = email_address.split(AT_SYMBOL);

            // Skip the prefix
            split.next();

            let domain = split.next();

            Ok(())
        }
    }

    pub fn detect_client_type<A: ToSocketAddrs + Copy, S: Into<String> + Copy>(
        addr: A,
        domain: S,
        security: ConnectionSecurity,
    ) -> types::Result<Option<ClientType>> {
        #[cfg(feature = "imap")]
        {
            match security {
                ConnectionSecurity::Tls => {
                    let tls = create_tls_connector().unwrap();

                    match imap::connect(addr, domain.into(), &tls).map_err(map_imap_error) {
                        Ok(_) => {
                            return Ok(Some(ClientType::Imap));
                        }
                        Err(_) => {}
                    };
                }
                ConnectionSecurity::StartTls => {
                    let tls = create_tls_connector().unwrap();

                    match imap::connect_starttls(addr, domain.into(), &tls).map_err(map_imap_error)
                    {
                        Ok(_) => {
                            return Ok(Some(ClientType::Imap));
                        }
                        Err(_) => {}
                    };
                }
                ConnectionSecurity::None => {
                    match TcpStream::connect(addr) {
                        Ok(stream) => {
                            let mut client = imap::Client::new(stream);

                            match client.read_greeting() {
                                Ok(_) => {
                                    return Ok(Some(ClientType::Imap));
                                }
                                Err(_) => {}
                            }
                        }
                        Err(_) => {}
                    };
                }
            }
        }
        #[cfg(feature = "pop")]
        {
            match security {
                ConnectionSecurity::Tls => {
                    let tls = create_tls_connector()?;

                    let mut client = pop3::Client::new(None);

                    match client
                        .connect(addr, &domain.into(), &tls)
                        .map_err(map_pop_error)
                    {
                        Ok(_) => {
                            return Ok(Some(ClientType::Pop));
                        }
                        Err(_) => {}
                    };
                }
                _ => {}
            }
        }

        Ok(None)
    }
}

// #[cfg(test)]
mod test {
    use crate::{ClientType, ConnectionSecurity};

    use super::ServiceDetector;

    #[test]
    fn client_type() {
        let domain = "outlook.office365.com";
        let imap_server = (domain, 993);

        assert_eq!(
            ServiceDetector::detect_client_type(imap_server, domain, ConnectionSecurity::Tls)
                .unwrap(),
            Some(ClientType::Imap),
        );

        let domain = "outlook.office365.com";
        let imap_server = (domain, 995);

        assert_eq!(
            ServiceDetector::detect_client_type(imap_server, domain, ConnectionSecurity::Tls)
                .unwrap(),
            Some(ClientType::Pop),
        );
    }
}

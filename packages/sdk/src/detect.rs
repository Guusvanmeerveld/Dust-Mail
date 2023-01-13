use std::net::{TcpStream, ToSocketAddrs};

#[cfg(feature = "imap")]
use crate::imap::map_imap_error;
#[cfg(feature = "pop")]
use crate::parse::map_pop_error;

#[cfg(feature = "imap")]
use imap;

use crate::{
    tls::create_tls_connector,
    types::{self, ConnectionSecurity, IncomingClientType},
};

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
    ) -> types::Result<Option<IncomingClientType>> {
        #[cfg(feature = "imap")]
        {
            match security {
                ConnectionSecurity::Tls => {
                    let tls = create_tls_connector().unwrap();

                    match imap::connect(addr, domain.into(), &tls).map_err(map_imap_error) {
                        Ok(_) => {
                            return Ok(Some(IncomingClientType::Imap));
                        }
                        Err(_) => {}
                    };
                }
                ConnectionSecurity::StartTls => {
                    let tls = create_tls_connector().unwrap();

                    match imap::connect_starttls(addr, domain.into(), &tls).map_err(map_imap_error)
                    {
                        Ok(_) => {
                            return Ok(Some(IncomingClientType::Imap));
                        }
                        Err(_) => {}
                    };
                }
                ConnectionSecurity::Plain => {
                    match TcpStream::connect(addr) {
                        Ok(stream) => {
                            let mut client = imap::Client::new(stream);

                            match client.read_greeting() {
                                Ok(_) => {
                                    return Ok(Some(IncomingClientType::Imap));
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

                    match pop3::connect(addr, &domain.into(), &tls, None).map_err(map_pop_error) {
                        Ok(_) => {
                            return Ok(Some(IncomingClientType::Pop));
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

#[cfg(test)]
mod test {

    use crate::types::{ConnectionSecurity, IncomingClientType};

    use super::ServiceDetector;

    #[test]
    fn client_type() {
        #[cfg(feature = "imap")]
        {
            let domain = "outlook.office365.com";
            let server = (domain, 993);

            assert_eq!(
                ServiceDetector::detect_client_type(server, domain, ConnectionSecurity::Tls)
                    .unwrap(),
                Some(IncomingClientType::Imap),
            );
        }

        #[cfg(feature = "pop")]
        {
            let domain = "outlook.office365.com";
            let server = (domain, 995);

            assert_eq!(
                ServiceDetector::detect_client_type(server, domain, ConnectionSecurity::Tls)
                    .unwrap(),
                Some(IncomingClientType::Pop),
            );
        }
    }
}

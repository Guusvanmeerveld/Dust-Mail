use std::{
    io::{Read, Write},
    net::TcpStream,
};

use native_tls::TlsStream;

#[cfg(feature = "imap")]
use crate::imap;

#[cfg(feature = "pop")]
use crate::pop;

use crate::types::{
    self, IncomingClientType, IncomingClientTypeWithClient, LoginOptions, MailBox, Message, Preview,
};

use super::Headers;

pub struct IncomingClient<S: Read + Write> {
    client: IncomingClientTypeWithClient<S>,
}

impl<S: Read + Write + 'static> IncomingClient<S> {
    pub fn login(self, username: &str, password: &str) -> types::Result<Box<dyn Session>> {
        match self.client {
            #[cfg(feature = "imap")]
            IncomingClientTypeWithClient::Imap(client) => {
                let session = client.login(username, password)?;

                Ok(Box::new(session))
            }
            #[cfg(feature = "pop")]
            IncomingClientTypeWithClient::Pop(client) => {
                let session = client.login(username, password)?;

                Ok(Box::new(session))
            }
        }
    }
}

pub trait Session {
    fn logout(&mut self) -> types::Result<()>;

    fn box_list(&mut self) -> types::Result<Vec<MailBox>>;

    fn get(&mut self, box_id: &str) -> types::Result<&MailBox>;

    fn messages(&mut self, box_id: &str, start: u32, end: u32) -> types::Result<Vec<Preview>>;

    fn get_headers(&mut self, box_id: &str, msg_id: &str) -> types::Result<Headers>;

    fn get_message(&mut self, box_id: &str, msg_id: &str) -> types::Result<Message>;
}

pub struct ClientConstructor;

impl ClientConstructor {
    fn check_options(
        client_type: &IncomingClientType,
        options: &Option<LoginOptions>,
    ) -> types::Result<()> {
        match client_type {
            #[cfg(feature = "imap")]
            IncomingClientType::Imap => match options {
                Some(_) => Ok(()),
                None => {
                    return Err(types::Error::new(
                        types::ErrorKind::Unsupported,
                        "Imap support requires the login options to be specified",
                    ))
                }
            },
            #[cfg(feature = "pop")]
            IncomingClientType::Pop => match options {
                Some(_) => Ok(()),
                None => {
                    return Err(types::Error::new(
                        types::ErrorKind::Unsupported,
                        "Pop support requires the login options to be specified",
                    ))
                }
            },
        }
    }

    /// Creates a new client over a secure tcp connection.
    pub fn new(
        client_type: IncomingClientType,
        options: Option<LoginOptions>,
    ) -> types::Result<IncomingClient<TlsStream<TcpStream>>> {
        Self::check_options(&client_type, &options)?;

        let client = match client_type {
            #[cfg(feature = "imap")]
            IncomingClientType::Imap => {
                let options = match options {
                    Some(options) => options,
                    // Is unreachable as we have already checked the options for every client type
                    None => unreachable!(),
                };

                let client = imap::connect(options)?;

                IncomingClientTypeWithClient::Imap(client)
            }
            #[cfg(feature = "pop")]
            IncomingClientType::Pop => {
                let options = match options {
                    Some(options) => options,
                    None => unreachable!(),
                };

                let client = pop::connect(options)?;

                IncomingClientTypeWithClient::Pop(client)
            }
        };

        Ok(IncomingClient { client })
    }

    /// Creates a new client over a plain tcp connection.
    ///
    /// # Do not use this in a production environment as it will send your credentials to the server without any encryption!
    pub fn new_plain(
        client_type: IncomingClientType,
        options: Option<LoginOptions>,
    ) -> types::Result<IncomingClient<TcpStream>> {
        Self::check_options(&client_type, &options)?;

        let client = match client_type {
            #[cfg(feature = "imap")]
            IncomingClientType::Imap => {
                let options = match options {
                    Some(options) => options,
                    None => unreachable!(),
                };

                let client = imap::connect_plain(options)?;

                IncomingClientTypeWithClient::Imap(client)
            }
            #[cfg(feature = "pop")]
            IncomingClientType::Pop => {
                let options = match options {
                    Some(options) => options,
                    None => unreachable!(),
                };

                let client = pop::connect_plain(options)?;

                IncomingClientTypeWithClient::Pop(client)
            }
        };

        Ok(IncomingClient { client })
    }
}

#[cfg(test)]
mod tests {
    use crate::types::LoginOptions;

    use std::env;

    use dotenv::dotenv;

    use super::{IncomingClientType, Session};

    fn create_session() -> Box<dyn Session> {
        dotenv().ok();

        let username = env::var("POP_USERNAME").unwrap();
        let password = env::var("POP_PASSWORD").unwrap();

        let server = env::var("POP_SERVER").unwrap();
        let port: u16 = 995;

        let options = LoginOptions::new(server, port);

        let client = super::ClientConstructor::new(IncomingClientType::Pop, Some(options)).unwrap();

        let session = client.login(&username, &password).unwrap();

        session
    }

    #[test]
    fn logout() {
        let mut session = create_session();

        session.logout().unwrap();
    }

    #[test]
    fn box_list() {
        let mut session = create_session();

        let list = session.box_list().unwrap();

        for mailbox in list {
            println!("{}", mailbox.message_count.unwrap());
        }
    }
}

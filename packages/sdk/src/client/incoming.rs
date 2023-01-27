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
    /// Logout of the session, closing the connection with the server if applicable.
    fn logout(&mut self) -> types::Result<()>;

    /// Returns a list of all of the mailboxes that are on the server.
    fn box_list(&mut self) -> types::Result<Vec<MailBox>>;

    /// Returns some basic information about a specified mailbox.
    fn get(&mut self, box_id: &str) -> types::Result<&MailBox>;

    /// Deletes a specified mailbox.
    fn delete(&mut self, box_id: &str) -> types::Result<()>;

    /// Creates a new mailbox with a specified id.
    fn create(&mut self, box_id: &str) -> types::Result<()>;

    /// Renames a specified mailbox.
    fn rename(&mut self, box_id: &str, new_name: &str) -> types::Result<()>;

    /// Returns a list of a specified range of messages from a specified mailbox.
    fn messages(&mut self, box_id: &str, start: u32, end: u32) -> types::Result<Vec<Preview>>;

    /// Returns all of the relevant data for a specified message.
    fn get_message(&mut self, box_id: &str, msg_id: &str) -> types::Result<Message>;
}

pub struct ClientConstructor;

/// Check whether the options exist if they are needed for a given client type.
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

impl ClientConstructor {
    /// Creates a new client over a secure tcp connection.
    pub fn new(
        client_type: &IncomingClientType,
        options: Option<LoginOptions>,
    ) -> types::Result<IncomingClient<TlsStream<TcpStream>>> {
        check_options(&client_type, &options)?;

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
        client_type: &IncomingClientType,
        options: Option<LoginOptions>,
    ) -> types::Result<IncomingClient<TcpStream>> {
        check_options(&client_type, &options)?;

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

        let options = LoginOptions::new(server, &port);

        let client =
            super::ClientConstructor::new(&IncomingClientType::Pop, Some(options)).unwrap();

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
            println!("{}", mailbox.counts().unwrap().total());
        }
    }
}

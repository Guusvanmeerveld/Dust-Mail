use std::{
    io::{Read, Write},
    net::TcpStream,
};

use native_tls::TlsStream;

#[cfg(feature = "imap")]
use crate::imap::{self, ImapClient};

#[cfg(feature = "pop")]
use crate::pop::{self, PopClient};

use crate::types::{
    Error, ErrorKind, IncomingClientType, MailBox, Message, OAuthCredentials, Preview, Result,
};

enum IncomingClientTypeWithClient<S>
where
    S: Read + Write,
{
    #[cfg(feature = "imap")]
    Imap(ImapClient<S>),
    #[cfg(feature = "pop")]
    Pop(PopClient<S>),
}

pub struct IncomingClient<S: Read + Write + Send> {
    client: IncomingClientTypeWithClient<S>,
}

impl<S: Read + Write + 'static + Send> IncomingClient<S> {
    /// Login to the specified mail server using a username and a password.
    pub fn login<T: AsRef<str>>(
        self,
        username: T,
        password: T,
    ) -> Result<Box<dyn IncomingSession + Send>> {
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
            _ => Err(Error::new(
                ErrorKind::NoClientAvailable,
                "No valid mail client was found for the request configuration",
            )),
        }
    }

    /// Login to the specified mail servers using OAuth2 credentials, which consist of an access token and a usernames
    pub fn oauth2_login(
        self,
        oauth_credentials: &OAuthCredentials,
    ) -> Result<Box<dyn IncomingSession + Send>> {
        match self.client {
            #[cfg(feature = "imap")]
            IncomingClientTypeWithClient::Imap(client) => {
                let session = client.oauth2_login(oauth_credentials)?;

                Ok(Box::new(session))
            }
            // #[cfg(feature = "pop")]
            // IncomingClientTypeWithClient::Pop(client) => {
            //     let session = client.login(username, password)?;

            //     Ok(Box::new(session))
            // }
            _ => Err(Error::new(
                ErrorKind::NoClientAvailable,
                "OAuth2 login is not supported by the specified incoming client type",
            )),
        }
    }
}

pub trait IncomingSession {
    /// Logout of the session, closing the connection with the server if applicable.
    fn logout(&mut self) -> Result<()>;

    /// Returns a list of all of the mailboxes that are on the server.
    fn box_list(&mut self) -> Result<&Vec<MailBox>>;

    /// Returns some basic information about a specified mailbox.
    fn get(&mut self, box_id: &str) -> Result<&MailBox>;

    /// Deletes a specified mailbox.
    fn delete(&mut self, box_id: &str) -> Result<()>;

    /// Creates a new mailbox with a specified id.
    fn create(&mut self, box_id: &str) -> Result<()>;

    /// Renames a specified mailbox.
    fn rename(&mut self, box_id: &str, new_name: &str) -> Result<()>;

    /// Returns a list of a specified range of messages from a specified mailbox.
    fn messages(&mut self, box_id: &str, start: u32, end: u32) -> Result<Vec<Preview>>;

    /// Returns all of the relevant data for a specified message.
    fn get_message(&mut self, box_id: &str, msg_id: &str) -> Result<Message>;
}

/// A struct used to create a connection to an incoming mail server.
///
/// Use the `new()` method to build a connection.
pub struct IncomingClientBuilder {
    client_type: IncomingClientType,
    server: Option<String>,
    port: Option<u16>,
}

impl IncomingClientBuilder {
    /// Creates an incoming client builder given an incoming client type.
    ///
    /// This incoming client type will specify what kind of protocol is going to be used to connect to the later specified mail server.
    pub fn new(client_type: &IncomingClientType) -> Self {
        Self {
            client_type: client_type.clone(),
            port: None,
            server: None,
        }
    }

    /// Set the port of the server to connect to.
    ///
    /// E.g `993`
    pub fn set_port<S: Into<u16>>(&mut self, port: S) -> &mut Self {
        self.port = Some(port.into());

        self
    }

    /// Set the domain name of the server to connect to.
    ///
    /// E.g `example.com`
    pub fn set_server<S: Into<String>>(&mut self, server: S) -> &mut Self {
        self.server = Some(server.into());

        self
    }

    /// Internal function used to check if the domain and port have been set and return them if they are set.
    ///
    /// This function will error if either one is not set.
    fn get_connect_config(&self) -> Result<(&str, &u16)> {
        let port = match self.port.as_ref() {
            Some(port) => port,
            None => {
                return Err(Error::new(
                    ErrorKind::InvalidLoginConfig,
                    "Missing port from login config",
                ))
            }
        };

        let server = match self.server.as_ref() {
            Some(server) => server,
            None => {
                return Err(Error::new(
                    ErrorKind::InvalidLoginConfig,
                    "Missing server from login config",
                ))
            }
        };

        return Ok((server, port));
    }

    /// Creates a new client over a secure tcp connection.
    pub fn build(&self) -> Result<IncomingClient<TlsStream<TcpStream>>> {
        let client = match self.client_type {
            #[cfg(feature = "imap")]
            IncomingClientType::Imap => {
                let (server, port) = self.get_connect_config()?;

                let client = imap::connect(server, port.clone())?;

                IncomingClientTypeWithClient::Imap(client)
            }
            #[cfg(feature = "pop")]
            IncomingClientType::Pop => {
                let (server, port) = self.get_connect_config()?;

                let client = pop::connect(server, port.clone())?;

                IncomingClientTypeWithClient::Pop(client)
            }
        };

        Ok(IncomingClient { client })
    }

    /// Creates a new client over a plain tcp connection.
    ///
    /// ### Do not use this in a production environment as it will send your credentials to the server without any encryption!
    pub fn build_plain(&self) -> Result<IncomingClient<TcpStream>> {
        let client = match self.client_type {
            #[cfg(feature = "imap")]
            IncomingClientType::Imap => {
                let (server, port) = self.get_connect_config()?;

                let client = imap::connect_plain(server, port.clone())?;

                IncomingClientTypeWithClient::Imap(client)
            }
            #[cfg(feature = "pop")]
            IncomingClientType::Pop => {
                let (server, port) = self.get_connect_config()?;

                let client = pop::connect_plain(server, port.clone())?;

                IncomingClientTypeWithClient::Pop(client)
            }
        };

        Ok(IncomingClient { client })
    }
}

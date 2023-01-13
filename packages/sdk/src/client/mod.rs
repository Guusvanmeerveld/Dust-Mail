use std::{
    collections::HashMap,
    io::{Read, Write},
    net::TcpStream,
};

use native_tls::TlsStream;

#[cfg(feature = "imap")]
use crate::imap::{self};

#[cfg(feature = "pop")]
use crate::pop::{self};

use crate::types::{
    self, ClientType, ClientTypeWithClient, ClientTypeWithSession, LoginOptions, MailBox, Message,
    Preview,
};

pub struct IncomingClient<S>
where
    S: Read + Write,
{
    client: ClientTypeWithClient<S>,
}

pub struct IncomingSession<S>
where
    S: Read + Write,
{
    session: ClientTypeWithSession<S>,
}

pub type Headers = HashMap<String, String>;

impl<S: Read + Write> IncomingClient<S> {
    fn login(self, username: &str, password: &str) -> types::Result<IncomingSession<S>> {
        let session = match self.client {
            #[cfg(feature = "imap")]
            ClientTypeWithClient::Imap(client) => {
                let session = client.login(username, password)?;

                ClientTypeWithSession::Imap(session)
            }
            #[cfg(feature = "pop")]
            ClientTypeWithClient::Pop(client) => {
                let mut client = client;

                client.login(username, password)?;

                ClientTypeWithSession::Pop(client)
            }
        };

        Ok(IncomingSession { session })
    }
}

// As far as im aware, there is no way to statically use a trait as a return type on a function, so we have to do this stuff.
impl<S: Read + Write> IncomingSessionTrait for IncomingSession<S> {
    fn logout(&mut self) -> types::Result<()> {
        match &mut self.session {
            #[cfg(feature = "imap")]
            ClientTypeWithSession::Imap(session) => session.logout(),
            #[cfg(feature = "pop")]
            ClientTypeWithSession::Pop(session) => session.logout(),
        }
    }

    fn box_list(&mut self) -> types::Result<Vec<MailBox>> {
        match &mut self.session {
            #[cfg(feature = "imap")]
            ClientTypeWithSession::Imap(session) => session.box_list(),
            #[cfg(feature = "pop")]
            ClientTypeWithSession::Pop(session) => session.box_list(),
        }
    }

    fn get(&mut self, box_id: &str) -> types::Result<&MailBox> {
        match &mut self.session {
            #[cfg(feature = "imap")]
            ClientTypeWithSession::Imap(session) => session.get(box_id),
            #[cfg(feature = "pop")]
            ClientTypeWithSession::Pop(session) => session.get(box_id),
        }
    }

    fn messages(&mut self, box_id: &str, start: u32, end: u32) -> types::Result<Vec<Preview>> {
        match &mut self.session {
            #[cfg(feature = "imap")]
            ClientTypeWithSession::Imap(session) => session.messages(box_id, start, end),
            #[cfg(feature = "pop")]
            ClientTypeWithSession::Pop(session) => session.messages(box_id, start, end),
        }
    }

    fn get_headers(&mut self, box_id: &str, msg_id: &str) -> types::Result<Headers> {
        match &mut self.session {
            #[cfg(feature = "imap")]
            ClientTypeWithSession::Imap(session) => session.get_headers(box_id, msg_id),
            #[cfg(feature = "pop")]
            ClientTypeWithSession::Pop(session) => session.get_headers(box_id, msg_id),
        }
    }

    fn get_message(&mut self, box_id: &str, msg_id: &str) -> types::Result<Message> {
        match &mut self.session {
            #[cfg(feature = "imap")]
            ClientTypeWithSession::Imap(session) => session.get_message(box_id, msg_id),
            #[cfg(feature = "pop")]
            ClientTypeWithSession::Pop(session) => session.get_message(box_id, msg_id),
        }
    }
}

pub trait IncomingSessionTrait {
    fn logout(&mut self) -> types::Result<()>;

    fn box_list(&mut self) -> types::Result<Vec<MailBox>>;

    fn get(&mut self, box_id: &str) -> types::Result<&MailBox>;

    fn messages(&mut self, box_id: &str, start: u32, end: u32) -> types::Result<Vec<Preview>>;

    fn get_headers(&mut self, box_id: &str, msg_id: &str) -> types::Result<Headers>;

    fn get_message(&mut self, box_id: &str, msg_id: &str) -> types::Result<Message>;
}

pub struct ClientConstructor {}

impl ClientConstructor {
    pub fn new_incoming(
        client_type: ClientType,
        options: Option<LoginOptions>,
    ) -> types::Result<IncomingClient<TlsStream<TcpStream>>> {
        let client = match client_type {
            #[cfg(feature = "imap")]
            ClientType::Imap => {
                let options = match options {
                    Some(options) => options,
                    None => {
                        return Err(types::Error::new(
                            types::ErrorKind::Unsupported,
                            "Imap support requires the login options to be specified",
                        ))
                    }
                };

                let client = imap::connect(options)?;

                ClientTypeWithClient::Imap(client)
            }
            #[cfg(feature = "pop")]
            ClientType::Pop => {
                let options = match options {
                    Some(options) => options,
                    None => {
                        return Err(types::Error::new(
                            types::ErrorKind::Unsupported,
                            "Pop support requires the login options to be specified",
                        ))
                    }
                };

                let session = pop::connect(options)?;

                ClientTypeWithClient::Pop(session)
            }
        };

        Ok(IncomingClient { client })
    }
}

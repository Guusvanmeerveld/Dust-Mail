mod parse;

use std::collections::HashMap;

use async_native_tls::{TlsConnector, TlsStream};
use async_pop3::types::UniqueIDResponse;
use async_trait::async_trait;
use tokio::{
    io::{AsyncRead, AsyncWrite},
    net::TcpStream,
};

use crate::{
    client::incoming::IncomingSession,
    parse::{parse_headers, parse_rfc822},
    types::{Counts, Error, ErrorKind, Flag, MailBox, Message, Preview, Result},
};

use parse::parse_address;

use self::parse::parse_preview_from_headers;

const MAILBOX_DEFAULT_NAME: &str = "Inbox";

pub struct PopClient<S: AsyncRead + AsyncWrite + Unpin> {
    session: async_pop3::Client<S>,
}

pub struct PopSession<S: AsyncRead + AsyncWrite + Unpin> {
    session: async_pop3::Client<S>,
    current_mailbox: Vec<MailBox>,
    unique_id_map: HashMap<String, u32>,
}

pub async fn connect<S: AsRef<str>, P: Into<u16>>(
    server: S,
    port: P,
) -> Result<PopClient<TlsStream<TcpStream>>> {
    let tls = TlsConnector::new();

    let session =
        async_pop3::connect((server.as_ref(), port.into()), server.as_ref(), &tls, None).await?;

    Ok(PopClient { session })
}

pub async fn connect_plain<S: AsRef<str>, P: Into<u16>>(
    server: S,
    port: P,
) -> Result<PopClient<TcpStream>> {
    let session = async_pop3::connect_plain((server.as_ref(), port.into()), None).await?;

    Ok(PopClient { session })
}

impl<S: AsyncRead + AsyncWrite + Unpin> PopClient<S> {
    pub async fn login<T: AsRef<str>>(self, username: T, password: T) -> Result<PopSession<S>> {
        let mut session = self.session;

        session.login(username.as_ref(), password.as_ref()).await?;

        // session.capabilities()

        Ok(PopSession {
            session,
            current_mailbox: Vec::new(),
            unique_id_map: HashMap::new(),
        })
    }
}

impl<S: AsyncRead + AsyncWrite + Unpin> PopSession<S> {
    fn get_session_mut(&mut self) -> &mut async_pop3::Client<S> {
        &mut self.session
    }

    /// Fetches the message count from the pop server and creates a new 'fake' mailbox.
    ///
    /// We do this because Pop does not support mailboxes.
    async fn get_default_box(&mut self) -> Result<MailBox> {
        let session = self.get_session_mut();

        let message_count = session.stat().await?.0;

        let box_name = MAILBOX_DEFAULT_NAME;

        let counts = Counts::new(0, message_count);

        let mailbox = MailBox::new(Some(counts), None, Vec::new(), true, box_name, box_name);

        Ok(mailbox)
    }

    async fn get_msg_number_from_msg_id(&mut self, msg_id: &str) -> Result<u32> {
        match self.unique_id_map.get(msg_id) {
            Some(msg_number) => return Ok(msg_number.clone()),
            None => {}
        };

        let session = self.get_session_mut();

        let unique_id_vec = match session.uidl(None).await? {
            UniqueIDResponse::UniqueID(_) => {
                // We gave the function a 'None' so it should never return this
                unreachable!()
            }
            UniqueIDResponse::UniqueIDList(unique_ids) => unique_ids,
        };

        self.unique_id_map = unique_id_vec
            .into_iter()
            .map(|(msg_number, msg_id)| (msg_id, msg_number))
            .collect();

        match self.unique_id_map.get(msg_id) {
            Some(msg_number) => Ok(msg_number.clone()),
            None => Err(Error::new(
                ErrorKind::UnexpectedBehavior,
                format!("Could not find a message with id {}", msg_id),
            )),
        }
    }
}

#[async_trait]
impl<S: AsyncRead + AsyncWrite + Unpin + Send> IncomingSession for PopSession<S> {
    async fn logout(&mut self) -> Result<()> {
        let session = self.get_session_mut();

        session.quit().await?;

        Ok(())
    }

    async fn box_list(&mut self) -> Result<&Vec<MailBox>> {
        self.current_mailbox = vec![self.get_default_box().await?];

        Ok(&self.current_mailbox)
    }

    async fn get(&mut self, _: &str) -> Result<&MailBox> {
        self.current_mailbox = vec![self.get_default_box().await?];

        let selected_box = match self.current_mailbox.first() {
            Some(mailbox) => mailbox,
            None => unreachable!(),
        };

        Ok(selected_box)
    }

    async fn delete(&mut self, _: &str) -> Result<()> {
        Err(Error::new(
            ErrorKind::Unsupported,
            "Pop does not support deleting mailboxes",
        ))
    }

    async fn rename(&mut self, _: &str, _: &str) -> Result<()> {
        Err(Error::new(
            ErrorKind::Unsupported,
            "Pop does not support renaming mailboxes",
        ))
    }

    async fn create(&mut self, _: &str) -> Result<()> {
        Err(Error::new(
            ErrorKind::Unsupported,
            "Pop does not support creating mailboxes",
        ))
    }

    async fn messages(&mut self, _: &str, start: u32, end: u32) -> Result<Vec<Preview>> {
        let mailbox = self.get_default_box().await?;

        let total_messages = mailbox.counts().unwrap().total();

        let session = self.get_session_mut();

        let sequence_start = if total_messages < &end {
            1
        } else {
            total_messages.saturating_sub(end).saturating_add(1)
        };

        let sequence_end = if total_messages < &start {
            1
        } else {
            total_messages.saturating_sub(start).saturating_add(1)
        };

        let msg_count = end.saturating_sub(start) as usize;

        let mut previews: Vec<Preview> = Vec::with_capacity(msg_count);

        let mut unique_id_map = HashMap::new();

        for msg_number in sequence_start..sequence_end {
            let uidl_response = session.uidl(Some(msg_number)).await?;

            let unique_id = match uidl_response {
                UniqueIDResponse::UniqueIDList(all_messages) => {
                    all_messages.into_iter().next().unwrap().1
                }
                UniqueIDResponse::UniqueID(item) => item.1,
            };

            // Add the unique id to the local map so we don't have to retrieve the entire list of unique id's later
            // just to get this message's msg_number.
            unique_id_map.insert(unique_id.clone(), msg_number);

            let header_bytes = session.top(msg_number, 0).await?;

            let headers = parse_headers(&header_bytes)?;

            let (from, mut flags, sent, subject) = parse_preview_from_headers(&headers)?;

            // If we have marked a message as deleted, we will add the corresponding flag
            if session.is_deleted(&msg_number) {
                flags.push(Flag::Deleted)
            }

            let preview = Preview::new(from, flags, unique_id, sent, subject);

            previews.push(preview)
        }

        self.unique_id_map.extend(unique_id_map);

        Ok(previews)
    }

    async fn get_message(&mut self, _: &str, msg_id: &str) -> Result<Message> {
        let msg_number = self.get_msg_number_from_msg_id(msg_id).await?;

        let session = self.get_session_mut();

        let message_bytes = session.retr(msg_number).await?;

        let content = parse_rfc822(&message_bytes).await?;

        let headers = parse_headers(&message_bytes)?;

        let (from, mut flags, sent, subject) = parse_preview_from_headers(&headers)?;

        // If we have marked a message as deleted, we will add the corresponding flag
        if session.is_deleted(&msg_number) {
            flags.push(Flag::Deleted)
        }

        let to = match headers.get("To") {
            Some(to) => parse_address(to),
            None => Vec::new(),
        };

        let cc = match headers.get("CC") {
            Some(cc) => parse_address(cc),
            None => Vec::new(),
        };

        let bcc = match headers.get("BCC") {
            Some(bcc) => parse_address(bcc),
            None => Vec::new(),
        };

        let message = Message::new(
            from, to, cc, bcc, headers, flags, msg_id, sent, subject, content,
        );

        Ok(message)
    }
}

#[cfg(test)]
mod test {

    use super::PopSession;

    use crate::client::incoming::IncomingSession;

    use async_native_tls::TlsStream;
    use dotenv::dotenv;
    use std::env;
    use tokio::net::TcpStream;

    async fn create_test_session() -> PopSession<TlsStream<TcpStream>> {
        dotenv().ok();

        let username = env::var("POP_USERNAME").unwrap();
        let password = env::var("POP_PASSWORD").unwrap();

        let server = env::var("POP_SERVER").unwrap();
        let port: u16 = 995;

        let client = super::connect(server, port).await.unwrap();

        let session = client.login(&username, &password).await.unwrap();

        session
    }

    #[tokio::test]
    async fn get_messages() {
        let mut session = create_test_session().await;

        let previews = session.messages("Inbox", 0, 10).await.unwrap();

        for preview in previews.iter() {
            println!(
                "{}: {:?}, \"{}\"",
                preview.id(),
                preview.sent(),
                preview.subject().unwrap()
            );
        }
    }

    #[tokio::test]
    async fn get_message() {
        let mut session = create_test_session().await;

        let message = session.get_message("Inbox", "17812").await.unwrap();

        println!("{:?}", message.to());
    }
}

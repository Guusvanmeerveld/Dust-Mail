mod parse;
use std::io::{Read, Write};
use std::net::TcpStream;

use imap::types::Fetch;
use native_tls::TlsStream;

use crate::client::incoming::Session;
use crate::parse::map_imap_error;
use crate::tls::create_tls_connector;
use crate::types::{self, Counts, LoginOptions, MailBox, Message, Preview};

const QUERY_PREVIEW: &str = "(FLAGS INTERNALDATE RFC822.SIZE ENVELOPE UID)";
const QUERY_FULL_MESSAGE: &str = "(FLAGS INTERNALDATE RFC822.SIZE ENVELOPE RFC822 UID)";

pub struct ImapClient<S: Read + Write> {
    client: imap::Client<S>,
}

pub struct ImapSession<S: Read + Write> {
    session: imap::Session<S>,
}

pub fn connect(options: LoginOptions) -> types::Result<ImapClient<TlsStream<TcpStream>>> {
    let tls = create_tls_connector()?;

    let domain = options.server();
    let port = *options.port();

    let client = imap::connect((domain, port), domain, &tls).map_err(map_imap_error)?;

    let imap_client = ImapClient { client };

    Ok(imap_client)
}

pub fn connect_plain(options: LoginOptions) -> types::Result<ImapClient<TcpStream>> {
    let domain = options.server();
    let port = *options.port();

    let stream = TcpStream::connect((domain, port))
        .map_err(|e| types::Error::new(types::ErrorKind::Connect, e.to_string()))?;

    let client = imap::Client::new(stream);

    Ok(ImapClient { client })
}

impl<S: Read + Write> ImapClient<S> {
    pub fn login(self, username: &str, password: &str) -> types::Result<ImapSession<S>> {
        let session = self
            .client
            .login(username, password)
            .map_err(|(err, _)| map_imap_error(err))?;

        let imap_session = ImapSession { session };

        Ok(imap_session)
    }
}

impl<S: Read + Write> ImapSession<S> {
    fn get_session_mut(&mut self) -> &mut imap::Session<S> {
        &mut self.session
    }

    fn name_from_box_id(id: &str, delimiter: Option<&str>) -> String {
        match delimiter {
            Some(delimiter) => {
                let split = id.split(delimiter);

                split.last().unwrap().to_owned()
            }
            None => id.to_owned(),
        }
    }

    fn get_item_from_fetch_else_err<'a>(fetched: &'a Vec<Fetch>) -> types::Result<&'a Fetch> {
        if fetched.len() > 1 {
            return Err(types::Error::new(
                types::ErrorKind::UnexpectedBehavior,
                "Got multiple messages when fetching a single message",
            ));
        }

        if fetched.len() == 0 {
            return Err(types::Error::new(
                types::ErrorKind::ImapError,
                "Could not find a message with that id",
            ));
        }

        match fetched.first() {
            Some(item) => Ok(item),
            None => {
                unreachable!()
            }
        }
    }
}

impl<S: Read + Write> Session for ImapSession<S> {
    fn logout(&mut self) -> types::Result<()> {
        let session = self.get_session_mut();

        session.logout().map_err(map_imap_error)?;

        Ok(())
    }

    fn box_list(&mut self) -> types::Result<Vec<MailBox>> {
        let session = self.get_session_mut();

        let names = session.list(None, Some("*")).map_err(map_imap_error)?;

        let mut boxes: Vec<MailBox> = Vec::new();

        for box_data in &names {
            let delimiter = match box_data.delimiter() {
                Some(delimiter) => Some(delimiter.to_owned()),
                None => None,
            };

            let id = box_data.name();

            let mailbox = MailBox::new(
                None,
                delimiter,
                id.to_owned(),
                Self::name_from_box_id(id, box_data.delimiter()),
            );

            boxes.push(mailbox);
        }

        Ok(boxes)
    }

    fn get(&mut self, box_id: &str) -> types::Result<MailBox> {
        let session = self.get_session_mut();

        let imap_mailbox = session.select(&box_id).map_err(map_imap_error)?;

        let data = session.list(None, Some(box_id)).map_err(map_imap_error)?;

        let box_data = data.first().unwrap();

        let delimiter = match box_data.delimiter() {
            Some(delimiter) => Some(delimiter.to_owned()),
            None => None,
        };

        let id = box_data.name();

        let counts = Counts::new(imap_mailbox.unseen.unwrap(), imap_mailbox.exists);

        let selected_box = MailBox::new(
            Some(counts),
            delimiter,
            id,
            &Self::name_from_box_id(id, box_data.delimiter()),
        );

        Ok(selected_box)
    }

    fn delete(&mut self, box_id: &str) -> types::Result<()> {
        let session = self.get_session_mut();

        session.delete(box_id).map_err(map_imap_error)
    }

    fn rename(&mut self, box_id: &str, new_name: &str) -> types::Result<()> {
        let mailbox = self.get(box_id)?;

        let new_name = match mailbox.delimiter() {
            Some(delimiter) => {
                let item_count = box_id.matches(delimiter).count();

                if item_count >= 2 {
                    let split = box_id.split(delimiter);

                    let mut prefix = split
                        .take(item_count)
                        .collect::<Vec<&str>>()
                        .join(delimiter);

                    prefix.push_str(new_name);

                    prefix
                } else {
                    new_name.to_owned()
                }
            }
            None => new_name.to_owned(),
        };

        let session = self.get_session_mut();

        session.close().map_err(map_imap_error)?;

        session.rename(box_id, new_name).map_err(map_imap_error)
    }

    fn create(&mut self, box_id: &str) -> types::Result<()> {
        let session = self.get_session_mut();

        session.create(box_id).map_err(map_imap_error)
    }

    fn messages(&mut self, box_id: &str, start: u32, end: u32) -> types::Result<Vec<Preview>> {
        let total_messages = match self.get(box_id) {
            Ok(selected_box) => match selected_box.counts() {
                Some(counts) => *counts.total(),
                None => unreachable!(),
            },
            Err(err) => return Err(err),
        };

        let session = self.get_session_mut();

        let sequence_start = if total_messages < end {
            0
        } else {
            total_messages.saturating_sub(end)
        };

        let sequence_end = if total_messages < start {
            0
        } else {
            total_messages.saturating_sub(start)
        };

        let sequence = format!("{}:{}", sequence_start, sequence_end);

        let data = session
            .fetch(sequence, QUERY_PREVIEW)
            .map_err(map_imap_error)?;

        session.close().map_err(map_imap_error)?;

        let mut previews: Vec<Preview> =
            Vec::with_capacity((sequence_end - sequence_start) as usize);

        for fetch in data.iter() {
            let preview = parse::fetch_to_preview(fetch)?;
            previews.push(preview);
        }

        Ok(previews)
    }

    fn get_message(&mut self, box_id: &str, msg_id: &str) -> types::Result<Message> {
        self.get(box_id)?;

        let session = self.get_session_mut();

        let fetched = session
            .uid_fetch(msg_id, QUERY_FULL_MESSAGE)
            .map_err(map_imap_error)?;

        session.close().map_err(map_imap_error)?;

        let fetch = Self::get_item_from_fetch_else_err(&fetched)?;

        parse::fetch_to_message(fetch)
    }
}

#[cfg(test)]
mod tests {
    use std::net::TcpStream;

    use native_tls::TlsStream;

    use super::{ImapSession, LoginOptions};

    use crate::{client::incoming::Session, utils::get_env};

    fn create_test_session() -> ImapSession<TlsStream<TcpStream>> {
        let envs = get_env();

        let username = envs.get("IMAP_USERNAME").unwrap();
        let password = envs.get("IMAP_PASSWORD").unwrap();

        let server = envs.get("IMAP_SERVER").unwrap();
        let port: u16 = 993;

        let options = LoginOptions::new(server, &port);

        let client = super::connect(options).unwrap();

        let session = client.login(username, password).unwrap();

        session
    }

    #[test]
    fn login() {
        let mut session = create_test_session();

        session.logout().unwrap();
    }

    #[test]
    fn get_mailbox() {
        let mut session = create_test_session();

        let box_name = "INBOX";

        let mailbox = session.get(box_name).unwrap();

        println!("{}", mailbox.counts().unwrap().total());

        session.logout().unwrap();
    }

    #[test]
    fn get_messages() {
        let mut session = create_test_session();

        let box_name = "INBOX";

        let messages = session.messages(box_name, 0, 10).unwrap();

        for preview in messages.into_iter() {
            println!("{}", preview.subject().unwrap());
        }

        session.logout().unwrap();
    }

    #[test]
    fn get_box_list() {
        let mut session = create_test_session();

        let box_list = session.box_list().unwrap();

        for mailbox in box_list {
            println!("{}", mailbox.id());
        }

        session.logout().unwrap();
    }

    #[test]
    fn get_message() {
        let mut session = create_test_session();

        let msg_id = "1113";
        let box_id = "INBOX";

        let message = session.get_message(box_id, msg_id).unwrap();

        println!("{}", message.content().text().unwrap());

        session.logout().unwrap();
    }

    #[test]
    fn rename_box() {
        let mut session = create_test_session();

        let new_box_name = "Delivery";
        let box_id = "Test";

        session.rename(box_id, new_box_name).unwrap();

        session.logout().unwrap();
    }
}

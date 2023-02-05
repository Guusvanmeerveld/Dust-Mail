mod parse;
mod types;
mod utils;
use std::io::{Read, Write};
use std::net::TcpStream;
use std::time::{Duration, Instant};

use imap::types::Fetch as ImapFetch;
use native_tls::TlsStream;

use crate::client::incoming::Session;
use crate::parse::map_imap_error;
use crate::tls::create_tls_connector;
use crate::types::{Error, ErrorKind, LoginOptions, MailBox, Message, Preview, Result};

const QUERY_PREVIEW: &str = "(FLAGS INTERNALDATE RFC822.SIZE ENVELOPE UID)";
const QUERY_FULL_MESSAGE: &str = "(FLAGS INTERNALDATE RFC822.SIZE ENVELOPE RFC822 UID)";

const REFRESH_BOX_LIST_TIMEOUT: u64 = 1 * 60;

pub struct ImapClient<S: Read + Write> {
    client: imap::Client<S>,
}

pub struct ImapSession<S: Read + Write> {
    session: imap::Session<S>,
    box_list: Vec<MailBox>,
    box_list_last_refresh: Option<Instant>,
    selected_box: Option<MailBox>,
}

pub fn connect(options: LoginOptions) -> Result<ImapClient<TlsStream<TcpStream>>> {
    let tls = create_tls_connector()?;

    let domain = options.server();
    let port = *options.port();

    let client = imap::connect((domain, port), domain, &tls).map_err(map_imap_error)?;

    let imap_client = ImapClient { client };

    Ok(imap_client)
}

pub fn connect_plain(options: LoginOptions) -> Result<ImapClient<TcpStream>> {
    let domain = options.server();
    let port = *options.port();

    let stream = TcpStream::connect((domain, port))
        .map_err(|e| Error::new(ErrorKind::Connect, e.to_string()))?;

    let client = imap::Client::new(stream);

    Ok(ImapClient { client })
}

impl<S: Read + Write> ImapClient<S> {
    pub fn login(self, username: &str, password: &str) -> Result<ImapSession<S>> {
        let session = self
            .client
            .login(username, password)
            .map_err(|(err, _)| map_imap_error(err))?;

        let imap_session = ImapSession {
            session,
            box_list: Vec::new(),
            box_list_last_refresh: None,
            selected_box: None,
        };

        Ok(imap_session)
    }
}

impl<S: Read + Write> ImapSession<S> {
    fn get_session_mut(&mut self) -> &mut imap::Session<S> {
        &mut self.session
    }

    /// Given an array of fetches that is expected to have length 1, return that one fetch and error if it has more or less than 1 items.
    fn get_item_from_fetch_else_err<'a>(fetched: &'a Vec<ImapFetch>) -> Result<&'a ImapFetch> {
        // if fetched.len() > 1 {
        //     return Err(Error::new(
        //         ErrorKind::UnexpectedBehavior,
        //         "Got multiple messages when fetching a single message",
        //     ));
        // }

        if fetched.len() == 0 {
            return Err(Error::new(
                ErrorKind::ImapError,
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

    fn close(&mut self) -> Result<()> {
        let session = self.get_session_mut();

        session.close().map_err(map_imap_error)?;

        self.selected_box = None;

        Ok(())
    }
}

impl<S: Read + Write> Session for ImapSession<S> {
    fn logout(&mut self) -> Result<()> {
        let session = self.get_session_mut();

        session.logout().map_err(map_imap_error)?;

        Ok(())
    }

    fn box_list(&mut self) -> Result<&Vec<MailBox>> {
        let last_box_list_refresh = self.box_list_last_refresh;

        let session = self.get_session_mut();

        let timeout_duration = Duration::from_secs(REFRESH_BOX_LIST_TIMEOUT);

        if let Some(last_refresh) = last_box_list_refresh {
            if last_refresh
                .elapsed()
                .checked_sub(timeout_duration)
                .is_none()
            {
                return Ok(&self.box_list);
            }
        }

        let mailboxes = session.list(None, Some("*")).map_err(map_imap_error)?;

        let mailboxes = mailboxes
            .into_iter()
            .map(|mailbox| (mailbox, None))
            .collect();

        let boxes = parse::get_boxes_from_names(mailboxes);

        self.box_list_last_refresh = Some(Instant::now());

        self.box_list = boxes;

        Ok(&self.box_list)
    }

    fn get(&mut self, box_id: &str) -> Result<&MailBox> {
        let box_list_length = &self.box_list.len();

        let session = self.get_session_mut();

        let imap_counts = session.select(box_id).map_err(map_imap_error)?;

        // If we already have all of the mailboxes, return those instead.
        let mailbox = if box_list_length > &0 {
            let cached_box_list = self.box_list()?;

            if let Some(found_mailbox) = utils::find_box_in_list(cached_box_list, box_id) {
                found_mailbox.clone()
            } else {
                unreachable!()
            }
        // Otherwise retrieve them from the server
        } else {
            let names = session
                .list(Some(box_id), Some("*"))
                .map_err(map_imap_error)?;

            let mailboxes = parse::get_boxes_from_names(
                names
                    .iter()
                    .map(|name| {
                        if name.name() == box_id {
                            (name, Some(imap_counts.clone()))
                        } else {
                            (name, None)
                        }
                    })
                    .collect(),
            );

            match utils::find_box_in_list(&mailboxes, box_id) {
                Some(mailbox) => mailbox.clone(),
                None => {
                    return Err(Error::new(
                        ErrorKind::ImapError,
                        format!("Box with id '{}' not found", box_id),
                    ))
                }
            }
        };

        self.selected_box = Some(mailbox);

        let selected_box = match self.selected_box.as_ref() {
            Some(selected_box) => selected_box,
            None => unreachable!(),
        };

        Ok(selected_box)
    }

    fn delete(&mut self, box_id: &str) -> Result<()> {
        let session = self.get_session_mut();

        session.delete(box_id).map_err(map_imap_error)
    }

    fn rename(&mut self, box_id: &str, new_name: &str) -> Result<()> {
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

    fn create(&mut self, box_id: &str) -> Result<()> {
        let session = self.get_session_mut();

        session.create(box_id).map_err(map_imap_error)
    }

    fn messages(&mut self, box_id: &str, start: u32, end: u32) -> Result<Vec<Preview>> {
        let session = self.get_session_mut();

        let total_messages = session
            .select(&box_id)
            .map(|selected_box| selected_box.exists)
            .map_err(map_imap_error)?;

        if total_messages < 1 {
            return Ok(Vec::new());
        }

        let sequence_start = if total_messages < end {
            1
        } else {
            total_messages.saturating_sub(end).saturating_add(1)
        };

        let sequence_end = if total_messages < start {
            1
        } else {
            total_messages.saturating_sub(start)
        };

        let sequence = format!("{}:{}", sequence_start, sequence_end);

        let data = session
            .fetch(sequence, QUERY_PREVIEW)
            .map_err(map_imap_error)?;

        self.close()?;

        let mut previews: Vec<Preview> =
            Vec::with_capacity((sequence_end.saturating_sub(sequence_start)) as usize);

        for fetch in data.iter() {
            let preview = parse::fetch_to_preview(fetch)?;
            previews.insert(0, preview);
        }

        Ok(previews)
    }

    fn get_message(&mut self, box_id: &str, msg_id: &str) -> Result<Message> {
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

        let box_name = "Web";

        let mailbox = session.get(box_name).unwrap();

        println!("{:?}", mailbox);

        session.logout().unwrap();
    }

    #[test]
    fn get_messages() {
        let mut session = create_test_session();

        let box_name = "[Gmail]";

        let messages = session.messages(box_name, 0, 10).unwrap();

        for preview in messages.into_iter() {
            println!("{}", preview.sent().unwrap());
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

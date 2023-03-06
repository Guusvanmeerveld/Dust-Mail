mod parse;
mod types;
mod utils;
// use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpStream;
use std::time::{Duration, Instant};

use imap::types::{Fetch as ImapFetch, Mailbox as ImapMailbox};
use native_tls::TlsStream;

use crate::client::incoming::Session;
use crate::parse::map_imap_error;
use crate::tls::create_tls_connector;
use crate::types::{
    ConnectOptions,
    // Counts,
    Error,
    ErrorKind,
    MailBox,
    Message,
    Preview,
    Result,
};

use self::utils::find_box_in_list;

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
    // Whether the message count for each mailbox has been retrieved in this session.
    // retrieved_message_counts: bool,
    /// The currently selected box' id.
    selected_box: Option<(String, ImapMailbox)>,
}

pub fn connect(options: ConnectOptions) -> Result<ImapClient<TlsStream<TcpStream>>> {
    let tls = create_tls_connector()?;

    let domain = options.server();
    let port = *options.port();

    let client = imap::connect((domain, port), domain, &tls).map_err(map_imap_error)?;

    let imap_client = ImapClient { client };

    Ok(imap_client)
}

pub fn connect_plain(options: ConnectOptions) -> Result<ImapClient<TcpStream>> {
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
            // retrieved_message_counts: false,
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

    /// This function will check if a box with a given box id is actually selectable, throwing an error if it is not.
    fn box_is_selectable_else_err(&mut self, box_id: &str) -> Result<()> {
        if self.box_list.len() > 0 {
            let current_box_list = self.box_list()?;

            let requested_box = find_box_in_list(current_box_list, box_id);

            match requested_box {
                Some(mailbox) => {
                    if !mailbox.selectable() {
                        return Err(Error::new(
                            ErrorKind::ImapError,
                            format!("The mailbox with id '{}' is not selectable", box_id),
                        ));
                    }
                }
                None => {}
            }
        };

        Ok(())
    }

    /// Select a given box if it hasn't already been selected, otherwise return the already selected box.
    fn select(&mut self, box_id: &str) -> Result<ImapMailbox> {
        match self.selected_box.as_ref() {
            Some((selected_box_id, selected_box)) => {
                if selected_box_id == box_id {
                    return Ok(selected_box.clone());
                } else {
                    let session = self.get_session_mut();

                    session.close().map_err(map_imap_error)?;
                }
            }
            None => {}
        };

        let session = self.get_session_mut();

        let mailbox = session.select(box_id).map_err(map_imap_error)?;

        self.selected_box = Some((box_id.to_string(), mailbox.clone()));

        Ok(mailbox)
    }
}

impl<S: Read + Write> Session for ImapSession<S> {
    fn logout(&mut self) -> Result<()> {
        let session = self.get_session_mut();

        session.logout().map_err(map_imap_error)?;

        Ok(())
    }

    fn box_list(&mut self) -> Result<&Vec<MailBox>> {
        if let Some(last_refresh) = self.box_list_last_refresh {
            let timeout_duration = Duration::from_secs(REFRESH_BOX_LIST_TIMEOUT);

            if last_refresh
                .elapsed()
                .checked_sub(timeout_duration)
                .is_none()
            {
                return Ok(&self.box_list);
            }
        }

        // let has_retrieved_box_counts = self.retrieved_message_counts;

        let session = self.get_session_mut();

        let mailboxes = session.list(None, Some("*")).map_err(map_imap_error)?;

        // let mut count_map = HashMap::new();

        // if !has_retrieved_box_counts {
        //     for mailbox in &mailboxes {
        //         let counts = session
        //             .status(mailbox.name(), "(MESSAGES UNSEEN)")
        //             .map_err(map_imap_error)?;

        //         println!("{:?}", counts);
        //         count_map.insert(
        //             mailbox.name(),
        //             Counts::new(counts.unseen.unwrap_or(0), counts.exists),
        //         );
        //     }

        //     self.retrieved_message_counts = true;
        // } else {
        //     for mailbox in &self.box_list {
        //         if let Some(counts) = mailbox.counts() {
        //             count_map.insert(mailbox.id().clone(), counts.clone());
        //         }
        //     }
        // }

        let mailboxes: Vec<_> = mailboxes.iter().map(|mailbox| (mailbox, None)).collect();

        let boxes = parse::get_boxes_from_names(&mailboxes);

        self.box_list_last_refresh = Some(Instant::now());

        self.box_list = boxes;

        Ok(&self.box_list)
    }

    fn get(&mut self, box_id: &str) -> Result<&MailBox> {
        let box_list_length = &self.box_list.len();

        let session = self.get_session_mut();

        // let imap_counts = session.select(box_id).map_err(map_imap_error)?;

        // If we already have all of the mailboxes, return those instead.
        let mailbox = if box_list_length > &0 {
            let cached_box_list = self.box_list()?;

            if let Some(found_mailbox) = utils::find_box_in_list(cached_box_list, box_id) {
                found_mailbox
            } else {
                return Err(Error::new(
                    ErrorKind::MailBoxNotFound,
                    format!("Could not find a mailbox with id '{}'", box_id),
                ));
            }
        // Otherwise retrieve them from the server
        } else {
            let names = session
                .list(Some(box_id), Some("*"))
                .map_err(map_imap_error)?;

            let mailboxes_with_counts: Vec<_> = names
                .iter()
                .map(|name| {
                    // if name.name() == box_id {
                    //     (name, Some(imap_counts.clone()))
                    // } else {
                    (name, None)
                    // }
                })
                .collect();

            let mailboxes = parse::get_boxes_from_names(&mailboxes_with_counts);

            self.box_list = mailboxes;

            match utils::find_box_in_list(&self.box_list, box_id) {
                Some(mailbox) => mailbox,
                None => {
                    return Err(Error::new(
                        ErrorKind::ImapError,
                        format!("Box with id '{}' not found", box_id),
                    ))
                }
            }
        };

        Ok(mailbox)
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
                    new_name.to_string()
                }
            }
            None => new_name.to_string(),
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
        self.box_is_selectable_else_err(box_id)?;

        let total_messages = self
            .select(&box_id)
            .map(|selected_box| selected_box.exists)?;

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

        let session = self.get_session_mut();

        let data = session
            .fetch(sequence, QUERY_PREVIEW)
            .map_err(map_imap_error)?;

        let mut previews: Vec<Preview> =
            Vec::with_capacity((sequence_end.saturating_sub(sequence_start)) as usize);

        for fetch in data.iter() {
            let preview = parse::fetch_to_preview(fetch)?;
            previews.insert(0, preview);
        }

        Ok(previews)
    }

    fn get_message(&mut self, box_id: &str, msg_id: &str) -> Result<Message> {
        self.box_is_selectable_else_err(box_id)?;

        self.select(box_id)?;

        let session = self.get_session_mut();

        let fetched = session
            .uid_fetch(msg_id, QUERY_FULL_MESSAGE)
            .map_err(map_imap_error)?;

        let fetch = Self::get_item_from_fetch_else_err(&fetched)?;

        parse::fetch_to_message(fetch)
    }
}

#[cfg(test)]
mod tests {
    use std::net::TcpStream;

    use native_tls::TlsStream;

    use super::{ConnectOptions, ImapSession};

    use crate::client::incoming::Session;

    use dotenv::dotenv;

    use std::env;

    fn create_test_session() -> ImapSession<TlsStream<TcpStream>> {
        dotenv().ok();

        let username = env::var("IMAP_USERNAME").unwrap();
        let password = env::var("IMAP_PASSWORD").unwrap();

        let server = env::var("IMAP_SERVER").unwrap();
        let port: u16 = 993;

        let options = ConnectOptions::new(server, &port);

        let client = super::connect(options).unwrap();

        let session = client.login(&username, &password).unwrap();

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

        let box_name = "INBOX";

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

mod parse;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpStream;

use imap::types::{Fetch, Name};
use native_tls::TlsStream;

use crate::client::incoming::Session;
use crate::parse::map_imap_error;
use crate::tls::create_tls_connector;
use crate::types::{self, Counts, LoginOptions, MailBox, Message, Preview};

const QUERY_PREVIEW: &str = "(FLAGS INTERNALDATE RFC822.SIZE ENVELOPE UID)";
const QUERY_FULL_MESSAGE: &str = "(FLAGS INTERNALDATE RFC822.SIZE ENVELOPE RFC822 UID)";

#[derive(Debug)]
/// A struct useful for building a folder tree structure out of a flat mailbox array.
pub struct MailBoxTree {
    delimiter: Option<String>,
    children: HashMap<String, MailBoxTree>,
    id: String,
    name: String,
}

impl MailBoxTree {
    pub fn children_mut(&mut self) -> &mut HashMap<String, MailBoxTree> {
        &mut self.children
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    /// Convert this mailbox tree to a normal mailbox struct.
    pub fn to_mailbox(self) -> MailBox {
        let children = self
            .children
            .into_iter()
            .map(|(_, value)| value.to_mailbox())
            .collect();

        MailBox::new(None, self.delimiter, children, self.id, self.name)
    }

    pub fn new<S: Into<String>>(
        delimiter: Option<String>,
        children: HashMap<String, MailBoxTree>,
        id: S,
        name: S,
    ) -> Self {
        Self {
            delimiter,
            children,
            id: id.into(),
            name: name.into(),
        }
    }
}

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

    /// Given an array of fetches that is expected to have length 1, return that one fetch and error if it has more or less than 1 items.
    fn get_item_from_fetch_else_err<'a>(fetched: &'a Vec<Fetch>) -> types::Result<&'a Fetch> {
        // if fetched.len() > 1 {
        //     return Err(types::Error::new(
        //         types::ErrorKind::UnexpectedBehavior,
        //         "Got multiple messages when fetching a single message",
        //     ));
        // }

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

    /// Given a mailboxes id on the server and the delimiter assigned to that box, give that last item that is created when the id is splitted on the delimiter.
    fn name_from_box_id(id: &str, delimiter: Option<&str>) -> String {
        match delimiter {
            Some(delimiter) => {
                let split = id.split(delimiter);

                split.last().unwrap().to_owned()
            }
            None => id.to_owned(),
        }
    }

    /// This is a function that takes an array of mailbox names and builds it into a folder tree of mailboxes.
    fn get_boxes_from_names(names: &Vec<Name>) -> Vec<MailBox> {
        let mut folders: HashMap<String, MailBoxTree> = HashMap::new();

        for folder in names {
            match folder.delimiter() {
                Some(delimiter) => {
                    let parts = folder.name().split(delimiter);

                    let mut current: Option<&mut MailBoxTree> = None;

                    for part in parts {
                        let id = match current.as_ref() {
                            Some(current) => {
                                format!("{}{}{}", current.id(), delimiter, part)
                            }
                            None => String::from(part),
                        };

                        let children = match current {
                            Some(current_box) => current_box.children_mut(),
                            None => &mut folders,
                        };

                        current = Some(children.entry(String::from(part)).or_insert(
                            MailBoxTree::new(
                                Some(String::from(delimiter)),
                                HashMap::new(),
                                id.as_str(),
                                part,
                            ),
                        ));
                    }
                }
                None => {
                    let id = folder.name().to_string();

                    folders.insert(id.clone(), MailBoxTree::new(None, HashMap::new(), &id, &id));
                }
            }
        }

        folders
            .into_iter()
            .map(|(_, value)| value.to_mailbox())
            .collect()
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

        let boxes = Self::get_boxes_from_names(&names);

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

        let counts = Counts::new(
            imap_mailbox.unseen.unwrap_or_else(|| 0),
            imap_mailbox.exists,
        );

        let selected_box = MailBox::new(
            Some(counts),
            delimiter,
            Vec::new(),
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

        if total_messages < 1 {
            return Ok(Vec::new());
        }

        let session = self.get_session_mut();

        let sequence_start = if total_messages < end {
            1
        } else {
            total_messages.saturating_sub(end)
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

        let box_name = "Inbox";

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

mod parse;

use std::{collections::HashMap, io::Read, io::Write, net::TcpStream};

use native_tls::TlsStream;
use pop3::types::{Left, Right};

use crate::{
    client::incoming::Session,
    parse::{map_pop_error, parse_headers, parse_rfc822},
    tls::create_tls_connector,
    types::{Counts, Error, ErrorKind, Flag, LoginOptions, MailBox, Message, Preview, Result},
};

use parse::parse_address;

use self::parse::parse_preview_from_headers;

const MAILBOX_DEFAULT_NAME: &str = "Inbox";

pub struct PopClient<S: Read + Write> {
    session: pop3::Client<S>,
}

pub struct PopSession<S: Read + Write> {
    session: pop3::Client<S>,
    current_mailbox: Vec<MailBox>,
    unique_id_map: HashMap<String, u32>,
}

pub fn connect(options: LoginOptions) -> Result<PopClient<TlsStream<TcpStream>>> {
    let tls = create_tls_connector()?;

    let server = options.server();
    let port = *options.port();

    let session = pop3::connect((server, port), server, &tls, None).map_err(map_pop_error)?;

    Ok(PopClient { session })
}

pub fn connect_plain(options: LoginOptions) -> Result<PopClient<TcpStream>> {
    let server = options.server();
    let port = *options.port();

    let session = pop3::connect_plain((server, port), None).map_err(map_pop_error)?;

    Ok(PopClient { session })
}

impl<S: Read + Write> PopClient<S> {
    pub fn login(self, username: &str, password: &str) -> Result<PopSession<S>> {
        let mut session = self.session;

        session.login(username, password).map_err(map_pop_error)?;

        // session.capabilities()

        Ok(PopSession {
            session,
            current_mailbox: Vec::new(),
            unique_id_map: HashMap::new(),
        })
    }
}

impl<S: Read + Write> PopSession<S> {
    fn get_session_mut(&mut self) -> &mut pop3::Client<S> {
        &mut self.session
    }

    /// Fetches the message count from the pop server and creates a new 'fake' mailbox.
    ///
    /// We do this because Pop does not support mailboxes.
    fn get_default_box(&mut self) -> Result<MailBox> {
        let session = self.get_session_mut();

        let message_count = match session.stat().map_err(map_pop_error) {
            Ok(stats) => Some(stats.0),
            Err(err) => return Err(err),
        };

        let box_name = MAILBOX_DEFAULT_NAME;

        let counts: Option<Counts> = match message_count {
            Some(count) => Some(Counts::new(0, count)),
            None => None,
        };

        let mailbox = MailBox::new(counts, None, Vec::new(), true, box_name, box_name);

        Ok(mailbox)
    }

    fn get_msg_number_from_msg_id(&mut self, msg_id: &str) -> Result<u32> {
        match self.unique_id_map.get(msg_id) {
            Some(msg_number) => return Ok(msg_number.clone()),
            None => {}
        };

        let session = self.get_session_mut();

        let unique_id_vec = match session.uidl(None).map_err(map_pop_error)? {
            Left(unique_id_vec) => unique_id_vec,
            // We gave the function a 'None'
            Right(_) => {
                unreachable!()
            }
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

impl<S: Read + Write> Session for PopSession<S> {
    fn logout(&mut self) -> Result<()> {
        let session = self.get_session_mut();

        session.quit().map_err(map_pop_error)?;

        Ok(())
    }

    fn box_list(&mut self) -> Result<&Vec<MailBox>> {
        self.current_mailbox = vec![self.get_default_box()?];

        Ok(&self.current_mailbox)
    }

    fn get(&mut self, _: &str) -> Result<&MailBox> {
        self.current_mailbox = vec![self.get_default_box()?];

        let selected_box = match self.current_mailbox.first() {
            Some(mailbox) => mailbox,
            None => unreachable!(),
        };

        Ok(selected_box)
    }

    fn delete(&mut self, _: &str) -> Result<()> {
        Err(Error::new(
            ErrorKind::Unsupported,
            "Pop does not support deleting mailboxes",
        ))
    }

    fn rename(&mut self, _: &str, _: &str) -> Result<()> {
        Err(Error::new(
            ErrorKind::Unsupported,
            "Pop does not support renaming mailboxes",
        ))
    }

    fn create(&mut self, _: &str) -> Result<()> {
        Err(Error::new(
            ErrorKind::Unsupported,
            "Pop does not support creating mailboxes",
        ))
    }

    fn messages(&mut self, _: &str, start: u32, end: u32) -> Result<Vec<Preview>> {
        let mailbox = self.get_default_box()?;

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
            let unique_id = match session.uidl(Some(msg_number)).map_err(map_pop_error) {
                Ok(response) => match response {
                    Left(all_messages) => all_messages.into_iter().next().unwrap().1,
                    Right(item) => item.1,
                },
                Err(err) => return Err(err),
            };

            // Add the unique id to the local map so we don't have to retrieve the entire list of unique id's later
            // just to get this message's msg_number.
            unique_id_map.insert(unique_id.clone(), msg_number);

            let header_bytes = session.top(msg_number, 0).map_err(map_pop_error)?;

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

    fn get_message(&mut self, _: &str, msg_id: &str) -> Result<Message> {
        let msg_number = self.get_msg_number_from_msg_id(msg_id)?;

        let session = self.get_session_mut();

        let message_bytes = session.retr(msg_number).map_err(map_pop_error)?;

        let content = parse_rfc822(&message_bytes)?;

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
    use std::net::TcpStream;

    use super::PopSession;

    use crate::{client::incoming::Session, types::LoginOptions};

    use dotenv::dotenv;
    use native_tls::TlsStream;
    use std::env;

    fn create_test_session() -> PopSession<TlsStream<TcpStream>> {
        dotenv().ok();

        let username = env::var("POP_USERNAME").unwrap();
        let password = env::var("POP_PASSWORD").unwrap();

        let server = env::var("POP_SERVER").unwrap();
        let port: u16 = 995;

        let options = LoginOptions::new(&server, &port);

        let client = super::connect(options).unwrap();

        let session = client.login(&username, &password).unwrap();

        session
    }

    #[test]
    fn get_messages() {
        let mut session = create_test_session();

        let previews = session.messages("Inbox", 0, 10).unwrap();

        for preview in previews.iter() {
            println!(
                "{}: {:?}, \"{}\"",
                preview.id(),
                preview.sent(),
                preview.subject().unwrap()
            );
        }
    }

    #[test]
    fn get_message() {
        let mut session = create_test_session();

        let message = session.get_message("Inbox", "17812").unwrap();

        println!("{:?}", message.to());
    }
}

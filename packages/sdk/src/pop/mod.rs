mod parse;

use std::{collections::HashMap, io::Read, io::Write, net::TcpStream};

use chrono::DateTime;
use native_tls::TlsStream;
use pop3::types::{Left, Right};

use crate::{
    client::incoming::Session,
    parse::{map_parse_date_error, map_pop_error, parse_headers},
    tls::create_tls_connector,
    types::{self, Counts, LoginOptions, MailBox, Message, Preview},
};

use parse::parse_address;

const MAILBOX_DEFAULT_NAME: &str = "Inbox";

pub struct PopClient<S: Read + Write> {
    session: pop3::Client<S>,
}

pub struct PopSession<S: Read + Write> {
    session: pop3::Client<S>,
    mailbox: Option<MailBox>,
}

pub fn connect(options: LoginOptions) -> types::Result<PopClient<TlsStream<TcpStream>>> {
    let tls = create_tls_connector()?;

    let server = options.server();
    let port = *options.port();

    let session = pop3::connect((server, port), server, &tls, None).map_err(map_pop_error)?;

    Ok(PopClient { session })
}

pub fn connect_plain(options: LoginOptions) -> types::Result<PopClient<TcpStream>> {
    let server = options.server();
    let port = *options.port();

    let session = pop3::connect_plain((server, port), None).map_err(map_pop_error)?;

    Ok(PopClient { session })
}

impl<S: Read + Write> PopClient<S> {
    pub fn login(self, username: &str, password: &str) -> types::Result<PopSession<S>> {
        let mut session = self.session;

        session.login(username, password).map_err(map_pop_error)?;

        Ok(PopSession {
            session,
            mailbox: None,
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
    fn get_default_box(&mut self) -> types::Result<MailBox> {
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

        let mailbox = MailBox::new(counts, None, box_name, box_name);

        Ok(mailbox)
    }
}

impl<S: Read + Write> Session for PopSession<S> {
    fn logout(&mut self) -> types::Result<()> {
        let session = self.get_session_mut();

        session.quit().map_err(map_pop_error)?;

        Ok(())
    }

    fn box_list(&mut self) -> types::Result<Vec<MailBox>> {
        let default_box = self.get_default_box()?;

        Ok(vec![default_box])
    }

    fn get(&mut self, box_name: &str) -> types::Result<&MailBox> {
        self.mailbox = Some(self.get_default_box()?);

        let mailbox = self.mailbox.as_ref().unwrap();

        // If we request anything other than the default mailbox that we've defined, we throw an error saying that Pop does not support mailboxes
        if box_name != mailbox.name() {
            return Err(types::Error::new(
                types::ErrorKind::Unsupported,
                "Mailboxes are unsupported in Pop",
            ));
        } else {
            Ok(mailbox)
        }
    }

    fn delete(&mut self, _: &str) -> types::Result<()> {
        todo!()
    }

    fn rename(&mut self, _: &str, new_name: &str) -> types::Result<()> {
        todo!()
    }

    fn create(&mut self, _: &str) -> types::Result<()> {
        todo!()
    }

    fn messages(&mut self, _: &str, start: u32, end: u32) -> types::Result<Vec<Preview>> {
        let mailbox = self.get_default_box()?;

        let total_messages = mailbox.counts().unwrap().total();

        let session = self.get_session_mut();

        let sequence_start = if total_messages < &end {
            0
        } else {
            total_messages.saturating_sub(end)
        };

        let sequence_end = if total_messages < &start {
            0
        } else {
            total_messages.saturating_sub(start)
        };

        let msg_count = end.saturating_sub(start) as usize;

        let mut previews: Vec<Preview> = Vec::with_capacity(msg_count);

        for msg in sequence_start..sequence_end {
            let unique_id = match session.uidl(Some(msg)).map_err(map_pop_error) {
                Ok(response) => match response {
                    Left(all_messages) => all_messages.first().cloned().unwrap().1,
                    Right(item) => item.1,
                },
                Err(err) => return Err(err),
            };

            let header_bytes = session.top(msg, 0).map_err(map_pop_error)?;

            let headers = parse_headers(&header_bytes)?;

            let subject = headers.get("Subject").cloned();

            let sent = match headers.get("Date") {
                Some(date) => {
                    let datetime = match DateTime::parse_from_rfc2822(date.trim())
                        .map_err(map_parse_date_error)
                    {
                        Ok(datetime) => datetime,
                        Err(err) => return Err(err),
                    };

                    Some(datetime.timestamp())
                }
                None => None,
            };

            let from = match headers.get("From") {
                Some(from) => parse_address(from.clone()),
                None => Vec::new(),
            };

            let preview = Preview::new(from, unique_id, sent, subject);

            previews.push(preview)
        }

        Ok(previews)
    }

    fn get_headers(&mut self, _: &str, msg_id: &str) -> types::Result<HashMap<String, String>> {
        let mut session = self.get_session_mut();

        todo!()
    }

    fn get_message(&mut self, _: &str, msg_id: &str) -> types::Result<Message> {
        let mut session = self.get_session_mut();

        todo!()
    }
}

#[cfg(test)]
mod test {
    use std::{net::TcpStream, time::Instant};

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

        let options = LoginOptions::new(&server, port);

        let client = super::connect(options).unwrap();

        let session = client.login(&username, &password).unwrap();

        session
    }

    #[test]
    fn get_messages() {
        let mut session = create_test_session();

        let time = Instant::now();
        let previews = session.messages("Inbox", 0, 10).unwrap();
        let took = time.elapsed().as_millis();

        for preview in previews.iter() {
            println!("{}", preview.subject().unwrap());
        }

        println!("Took {}ms", took);
    }
}

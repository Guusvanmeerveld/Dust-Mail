mod parse;

use std::{collections::HashMap, io::Read, io::Write, net::TcpStream};

use chrono::DateTime;
use native_tls::TlsStream;
use pop3::types::{ErrorKind as PopErrorKind, Left, Right};

use crate::{
    client::IncomingSessionTrait as IncomingSession,
    parse::parse_headers,
    tls::create_tls_connector,
    types::{self, LoginOptions, MailBox, Message, Preview},
};

use parse::parse_address;

const MAILBOX_DEFAULT_NAME: &str = "Inbox";

pub fn map_pop_error(error: pop3::types::Error) -> types::Error {
    let kind: types::ErrorKind = match error.kind() {
        PopErrorKind::Server => types::ErrorKind::Server,
        PopErrorKind::Connection => types::ErrorKind::Connection,
        PopErrorKind::Read => types::ErrorKind::Read,
        PopErrorKind::Write => types::ErrorKind::Write,
        PopErrorKind::Tls => types::ErrorKind::Security,
        PopErrorKind::State => types::ErrorKind::UnexpectedBehavior,
    };

    types::Error::new(kind, error)
}

fn map_parse_date_error(error: chrono::ParseError) -> types::Error {
    types::Error::new(
        types::ErrorKind::Read,
        format!("Error parsing date from message: {}", error),
    )
}

pub struct PopSession<S: Read + Write> {
    pop_session: pop3::Client<S>,
    mailbox: Option<MailBox>,
}

pub fn connect(options: LoginOptions) -> types::Result<PopSession<TlsStream<TcpStream>>> {
    let tls = create_tls_connector()?;

    let server = options.server();
    let port = *options.port();

    let session = pop3::connect((server, port), server, &tls, None).map_err(map_pop_error)?;

    Ok(PopSession {
        pop_session: session,
        mailbox: None,
    })
}

pub fn connect_plain(options: LoginOptions) -> types::Result<PopSession<TcpStream>> {
    let server = options.server();
    let port = *options.port();

    let session = pop3::connect_plain((server, port), None).map_err(map_pop_error)?;

    Ok(PopSession {
        pop_session: session,
        mailbox: None,
    })
}

impl<S: Read + Write> PopSession<S> {
    pub fn login(&mut self, username: &str, password: &str) -> types::Result<()> {
        let session = self.get_session_mut();

        session.login(username, password).map_err(map_pop_error)
    }

    fn get_session_mut(&mut self) -> &mut pop3::Client<S> {
        &mut self.pop_session
    }

    fn get_default_box(&mut self) -> types::Result<MailBox> {
        let session = self.get_session_mut();

        let message_count = match session.stat().map_err(map_pop_error) {
            Ok(stats) => Some(stats.0),
            Err(err) => return Err(err),
        };

        let box_name = MAILBOX_DEFAULT_NAME;

        let mailbox = MailBox {
            id: box_name.to_owned(),
            name: box_name.to_owned(),
            delimiter: None,
            message_count,
            unseen_count: None,
        };

        Ok(mailbox)
    }
}

impl<S: Read + Write> IncomingSession for PopSession<S> {
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

        if box_name != mailbox.name {
            return Err(types::Error::new(
                types::ErrorKind::Unsupported,
                "Mailboxes are unsupported in Pop",
            ));
        } else {
            Ok(mailbox)
        }
    }

    fn messages(&mut self, _: &str, start: u32, end: u32) -> types::Result<Vec<Preview>> {
        let mailbox = self.get_default_box()?;

        let total_messages = mailbox.message_count.unwrap();

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

            let bytes = session.top(msg, 0).map_err(map_pop_error)?;

            let headers = parse_headers(&bytes)?;

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

            let preview = Preview {
                id: unique_id,
                subject,
                sent,
                from,
            };

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

    use crate::{client::IncomingSessionTrait, types::LoginOptions};

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

        let mut client = super::connect(options).unwrap();

        client.login(&username, &password).unwrap();

        client
    }

    #[test]
    fn get_messages() {
        let mut session = create_test_session();

        let time = Instant::now();
        let previews = session.messages("Inbox", 0, 10).unwrap();
        let took = time.elapsed().as_millis();

        for preview in previews.iter() {
            println!("{}", preview.subject.as_ref().unwrap());
        }
        println!("Took {}ms", took);
    }
}

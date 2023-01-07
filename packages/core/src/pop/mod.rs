mod parse;

use chrono::DateTime;
use pop3::{
    types::{ErrorKind as PopErrorKind, Left, Right},
    Client as PopSession,
};

use crate::{
    client::IncomingClient,
    tls::create_tls_connector,
    types::{self, MailBox, Message, Preview},
    LoginOptions,
};

use parse::{parse_address, parse_headers};

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

pub struct PopClient {
    pop_session: Option<PopSession>,
    mailbox: Option<MailBox>,
}

impl PopClient {
    pub fn new() -> Self {
        Self {
            pop_session: None,
            mailbox: None,
        }
    }

    fn get_session_mut(&mut self) -> types::Result<&mut PopSession> {
        match self.pop_session.as_mut() {
            Some(session) => Ok(session),
            None => Err(types::Error::new(
                types::ErrorKind::Connection,
                "Not logged in",
            )),
        }
    }

    fn get_default_box(&mut self) -> types::Result<MailBox> {
        let session = self.get_session_mut()?;

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

impl IncomingClient for PopClient {
    fn login(
        &mut self,
        username: &str,
        password: &str,
        options: Option<LoginOptions>,
    ) -> types::Result<()> {
        let options = match options {
            Some(options) => options,
            None => {
                return Err(types::Error::new(
                    types::ErrorKind::Input,
                    "Missing login options to connect to POP server",
                ))
            }
        };

        let tls = create_tls_connector()?;

        let mut client = PopSession::new(None);

        let server = options.server();
        let port = *options.port();

        client
            .connect((server, port), server, &tls)
            .map_err(map_pop_error)?;

        client
            .login(username.as_ref(), password.as_ref())
            .map_err(map_pop_error)?;

        self.pop_session = Some(client);

        Ok(())
    }

    fn is_logged_in(&mut self) -> bool {
        match self.pop_session.as_ref() {
            Some(session) => session.state == pop3::ClientState::Transaction,
            None => false,
        }
    }

    fn logout(&mut self) -> types::Result<()> {
        if !self.is_logged_in() {
            Ok(())
        } else {
            let session = self.get_session_mut()?;

            session.quit().map_err(map_pop_error)?;

            self.pop_session = None;

            Ok(())
        }
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

        let session = self.get_session_mut()?;

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

            let headers = parse_headers(bytes)?;

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

    fn get_message(&mut self, _: &str, id: &str) -> types::Result<Message> {
        let session = self.get_session_mut()?;
        todo!()
    }
}

#[cfg(test)]
mod test {
    use std::time::Instant;

    use super::PopClient;

    use crate::client::{ConnectionSecurity, IncomingClient, LoginOptions};

    use dotenv::dotenv;
    use std::env;

    fn create_test_client() -> PopClient {
        dotenv().ok();

        let mut client = PopClient::new();

        let username = env::var("POP_USERNAME").unwrap();
        let password = env::var("POP_PASSWORD").unwrap();

        let server = env::var("POP_SERVER").unwrap();
        let port: u16 = 995;
        let security = ConnectionSecurity::Tls;

        let options = LoginOptions::new(&server, port, security);

        client.login(&username, &password, Some(options)).unwrap();

        client
    }

    #[test]
    fn get_messages() {
        let mut client = create_test_client();

        let time = Instant::now();
        let previews = client.messages("Inbox", 0, 10).unwrap();
        let took = time.elapsed().as_millis();

        for preview in previews.iter() {
            println!("{}", preview.subject.as_ref().unwrap());
        }
        println!("Took {}ms", took);
    }
}

mod parse;

use chrono::DateTime;
use pop3::{
    types::{ErrorKind as PopErrorKind, Left, Right},
    Client as PopSession,
};

use crate::{
    client::Client,
    tls::create_tls_connector,
    types::{self, MailBox, Message, Preview},
    LoginOptions,
};

use parse::{parse_address, parse_headers};

const MAILBOX_DEFAULT_NAME: &str = "Inbox";

fn map_pop_error(error: pop3::types::Error) -> types::Error {
    let kind: types::ErrorKind = match error.kind() {
        PopErrorKind::Server => types::ErrorKind::Server,
        PopErrorKind::Connection => types::ErrorKind::Connection,
        PopErrorKind::Read => types::ErrorKind::Read,
        PopErrorKind::Write => types::ErrorKind::Write,
        PopErrorKind::Tls => types::ErrorKind::Security,
        PopErrorKind::State => types::ErrorKind::UnexpectedBehavior,
    };

    types::Error::new(kind, error.message())
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
        let session = match self.get_session_mut() {
            Ok(session) => session,
            Err(err) => return Err(err),
        };

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

impl Client for PopClient {
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

        let tls = match create_tls_connector() {
            Ok(tls) => tls,
            Err(err) => return Err(err),
        };

        let mut client = PopSession::new();

        let server = options.server();
        let port = *options.port();

        match client
            .connect((server, port), server, &tls)
            .map_err(map_pop_error)
        {
            Ok(_) => match client
                .login(username.as_ref(), password.as_ref())
                .map_err(map_pop_error)
            {
                Ok(_) => {
                    self.pop_session = Some(client);
                    Ok(())
                }
                Err(err) => Err(err),
            },
            Err(err) => Err(err),
        }
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
            let session = match self.get_session_mut() {
                Ok(session) => session,
                Err(err) => return Err(err),
            };

            match session.quit().map_err(map_pop_error) {
                Ok(_) => {
                    self.pop_session = None;
                    Ok(())
                }
                Err(err) => Err(err),
            }
        }
    }

    fn box_list(&mut self) -> types::Result<Vec<MailBox>> {
        match self.get_default_box() {
            Ok(default_box) => Ok(vec![default_box]),
            Err(err) => Err(err),
        }
    }

    fn get(&mut self, box_name: &str) -> types::Result<&MailBox> {
        self.mailbox = match self.get_default_box() {
            Ok(mailbox) => Some(mailbox),
            Err(err) => return Err(err),
        };

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
        let mailbox = match self.get_default_box() {
            Ok(mailbox) => mailbox,
            Err(err) => return Err(err),
        };

        let total_messages = mailbox.message_count.unwrap();

        let session = match self.get_session_mut() {
            Ok(session) => session,
            Err(err) => return Err(err),
        };

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

            match session.top(msg, 0).map_err(map_pop_error) {
                Ok(bytes) => {
                    let headers = parse_headers(bytes).unwrap();

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
                Err(err) => return Err(err),
            };
        }

        Ok(previews)
    }

    fn get_message(&mut self, _: &str, id: &str) -> types::Result<Message> {
        todo!()
    }
}

// #[cfg(test)]
mod test {
    use std::time::Instant;

    use super::PopClient;

    use crate::{
        client::{Client, ConnectionSecurity, LoginOptions},
        utils::get_env,
    };

    fn create_test_client() -> PopClient {
        let mut client = PopClient::new();

        let envs = get_env();

        let username = envs.get("POP_USERNAME").unwrap();
        let password = envs.get("POP_PASSWORD").unwrap();

        let server = envs.get("POP_SERVER").unwrap();
        let port: u16 = 995;
        let security = ConnectionSecurity::Tls;

        let options = LoginOptions::new(server, port, security);

        client.login(username, password, Some(options)).unwrap();

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

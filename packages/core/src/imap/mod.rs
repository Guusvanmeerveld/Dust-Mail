mod parse;

use std::net::TcpStream;

use imap::Session;
use native_tls::TlsStream;

use crate::client::{Client, ConnectionSecurity, LoginOptions};
use crate::tls::create_tls_connector;
use crate::types::{self, MailBox, Message, Preview};

type ImapSession = Session<TlsStream<TcpStream>>;

const QUERY_PREVIEW: &str = "(FLAGS INTERNALDATE RFC822.SIZE ENVELOPE UID)";
const QUERY_FULL_MESSAGE: &str = "(FLAGS INTERNALDATE RFC822.SIZE ENVELOPE BODY[] UID)";

fn map_imap_error(error: imap::Error) -> types::Error {
    types::Error::new(
        types::ErrorKind::Server,
        format!("Error with Imap server: {}", error),
    )
}

pub struct ImapClient {
    imap_session: Option<ImapSession>,
    selected_box: Option<MailBox>,
}

impl ImapClient {
    pub fn new() -> Self {
        Self {
            imap_session: None,
            selected_box: None,
        }
    }

    fn get_session_mut(&mut self) -> types::Result<&mut ImapSession> {
        match self.imap_session.as_mut() {
            Some(session) => Ok(session),
            None => Err(types::Error::new(
                types::ErrorKind::Connection,
                "Not logged in",
            )),
        }
    }

    fn name_from_box_id(id: &str, delimiter: Option<&str>) -> String {
        match delimiter {
            Some(delimiter) => {
                let split = id.split(&delimiter);

                split.last().unwrap().to_owned()
            }
            None => id.to_owned(),
        }
    }

    // fn select_box_and_return_session(&mut box_id: &str) -> &mut ImapSession {}
}

impl Client for ImapClient {
    fn login(
        &mut self,
        username: &str,
        password: &str,
        options_option: Option<LoginOptions>,
    ) -> types::Result<()> {
        if self.is_logged_in() {
            self.logout().unwrap();

            self.login(username, password, options_option)
        } else {
            match options_option {
                Some(options) => match create_tls_connector() {
                    Ok(tls) => {
                        let domain = options.server();
                        let security = options.security();
                        let port = *options.port();

                        let client_result = match security {
                            ConnectionSecurity::StartTls => {
                                imap::connect_starttls((domain, port), domain, &tls)
                                    .map_err(map_imap_error)
                            }
                            ConnectionSecurity::Tls => {
                                imap::connect((domain, port), domain, &tls).map_err(map_imap_error)
                            }
                            _ => Err(types::Error::new(
                                types::ErrorKind::Unsupported,
                                "Security protocol is not supported",
                            )),
                        };

                        match client_result {
                            Ok(client) => {
                                match client
                                    .login(username, password)
                                    .map_err(|(err, _)| map_imap_error(err))
                                {
                                    Ok(session) => {
                                        self.imap_session = Some(session);

                                        Ok(())
                                    }
                                    Err(err) => Err(err),
                                }
                            }
                            Err(err) => Err(err),
                        }
                    }
                    Err(err) => Err(err),
                },
                None => Err(types::Error::new(
                    types::ErrorKind::Input,
                    "Missing login options to connect to IMAP server",
                )),
            }
        }
    }

    fn is_logged_in(&mut self) -> bool {
        match self.imap_session {
            Some(_) => match self.imap_session.as_mut().unwrap().noop() {
                Ok(_) => true,
                Err(_) => false,
            },
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

            match session.logout().map_err(map_imap_error) {
                Ok(_) => {
                    self.imap_session = None;
                    Ok(())
                }
                Err(err) => Err(err),
            }
        }
    }

    fn box_list(&mut self) -> types::Result<Vec<MailBox>> {
        let session = match self.get_session_mut() {
            Ok(session) => session,
            Err(err) => return Err(err),
        };

        match session.list(None, Some("*")).map_err(map_imap_error) {
            Ok(names) => {
                let mut boxes: Vec<MailBox> = Vec::new();

                for data in &names {
                    let delimiter = match data.delimiter() {
                        Some(delimiter) => Some(delimiter.to_owned()),
                        None => None,
                    };

                    let id = data.name();

                    let mailbox = MailBox {
                        delimiter,
                        id: id.to_owned(),
                        name: Self::name_from_box_id(id, data.delimiter()),
                        message_count: None,
                        unseen_count: None,
                    };

                    boxes.push(mailbox);
                }

                Ok(boxes)
            }
            Err(err) => Err(err),
        }
    }

    fn get(&mut self, box_name: &str) -> types::Result<&MailBox> {
        let session = match self.get_session_mut() {
            Ok(session) => session,
            Err(err) => return Err(err),
        };

        match session.select(&box_name).map_err(map_imap_error) {
            Ok(mailbox) => match session.list(None, Some(box_name)).map_err(map_imap_error) {
                Ok(data) => {
                    let box_data = data.first().unwrap();

                    let delimiter = match box_data.delimiter() {
                        Some(delimiter) => Some(delimiter.to_owned()),
                        None => None,
                    };

                    let id = box_data.name();

                    let selected_box = MailBox {
                        delimiter,
                        id: id.to_owned(),
                        name: Self::name_from_box_id(id, box_data.delimiter()),
                        message_count: Some(mailbox.exists),
                        unseen_count: mailbox.unseen,
                    };

                    self.selected_box = Some(selected_box);

                    Ok(self.selected_box.as_ref().unwrap())
                }
                Err(err) => return Err(err),
            },
            Err(err) => Err(err),
        }
    }

    fn messages(&mut self, box_id: &str, start: u32, end: u32) -> types::Result<Vec<Preview>> {
        let total_messages = match self.get(box_id) {
            Ok(selected_box) => selected_box.message_count.unwrap(),
            Err(err) => return Err(err),
        };

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

        let sequence = format!("{}:{}", sequence_start, sequence_end);

        let fetch_result = session.fetch(sequence, QUERY_PREVIEW);

        match fetch_result.map_err(map_imap_error) {
            Ok(data) => {
                let mut previews: Vec<Preview> =
                    Vec::with_capacity((sequence_end - sequence_start) as usize);

                for fetch in data.iter() {
                    match parse::fetch_to_preview(fetch) {
                        Ok(preview) => {
                            previews.push(preview);
                        }
                        Err(err) => return Err(err),
                    }
                }

                Ok(previews)
            }
            Err(err) => Err(err),
        }
    }

    fn get_message(&mut self, box_id: &str, id: &str) -> types::Result<Message> {
        match self.get(box_id) {
            Ok(_) => {}
            Err(err) => return Err(err),
        };

        let session = match self.get_session_mut() {
            Ok(session) => session,
            Err(err) => return Err(err),
        };

        match session
            .uid_fetch(id, QUERY_FULL_MESSAGE)
            .map_err(map_imap_error)
        {
            Ok(fetched) => {
                if fetched.len() > 1 {
                    return Err(types::Error::new(
                        types::ErrorKind::UnexpectedBehavior,
                        "Got multiple messages when fetching a single message",
                    ));
                }

                if fetched.len() == 0 {
                    return Err(types::Error::new(
                        types::ErrorKind::Server,
                        "Could not find a message with that id",
                    ));
                }

                let fetch = fetched.first().unwrap();

                parse::fetch_to_message(fetch)
            }
            Err(err) => Err(err),
        }
    }
}

// #[cfg(test)]
mod tests {
    use super::{Client, ConnectionSecurity, ImapClient, LoginOptions};

    use crate::utils::get_env;

    fn create_test_client() -> ImapClient {
        let mut client = ImapClient::new();

        let envs = get_env();

        let username = envs.get("IMAP_USERNAME").unwrap();
        let password = envs.get("IMAP_PASSWORD").unwrap();

        let server = envs.get("IMAP_SERVER").unwrap();
        let port: u16 = 993;
        let security = ConnectionSecurity::Tls;

        let options = LoginOptions::new(server, port, security);

        client.login(username, password, Some(options)).unwrap();

        client
    }

    #[test]
    fn login() {
        let mut client = create_test_client();

        assert!(client.is_logged_in());

        client.logout().unwrap();
    }

    #[test]
    fn get_mailbox() {
        let mut client = create_test_client();

        let box_name = "INBOX";

        let mailbox = client.get(box_name).unwrap();

        println!("{}", mailbox.message_count.unwrap());

        client.logout().unwrap();
    }

    #[test]
    fn get_messages() {
        let mut client = create_test_client();

        let box_name = "INBOX";

        let messages = client.messages(box_name, 0, 10).unwrap();

        for preview in messages.into_iter() {
            println!("{}", preview.id);
        }

        client.logout().unwrap();
    }

    #[test]
    fn get_box_list() {
        let mut client = create_test_client();

        let box_list = client.box_list().unwrap();

        for mailbox in box_list {
            println!("{}", mailbox.name);
        }

        client.logout().unwrap();
    }

    #[test]
    fn get_message() {
        let mut client = create_test_client();

        let msg_id = "1";
        let box_id = "INBOX";

        let message = client.get_message(box_id, msg_id).unwrap();

        println!("{}", message.content.text.unwrap());

        client.logout().unwrap();
    }
}

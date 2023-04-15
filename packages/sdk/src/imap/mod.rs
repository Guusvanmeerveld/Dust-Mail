mod parse;
// use std::collections::HashMap;
use std::fmt::Debug;

use async_imap::types::Fetch as ImapFetch;
use async_native_tls::{TlsConnector, TlsStream};
use async_trait::async_trait;
use futures::StreamExt;
use tokio::io::{AsyncRead, AsyncWrite};
use tokio::net::TcpStream;
use tokio::time::Duration;

use crate::cache::{Cache, Refresher};
use crate::client::incoming::IncomingSession;
use crate::types::{
    Error, ErrorKind, MailBox, MailBoxList, Message, OAuthCredentials, Preview, Result,
};

const QUERY_PREVIEW: &str = "(FLAGS INTERNALDATE RFC822.SIZE ENVELOPE UID)";
const QUERY_FULL_MESSAGE: &str = "(FLAGS INTERNALDATE RFC822.SIZE ENVELOPE RFC822 UID)";

// const STATUS_ITEMS: &str = "(MESSAGES UNSEEN)";

struct BoxListRefresher<'a, S: AsyncRead + AsyncWrite + Unpin + Debug + Send> {
    session: &'a mut async_imap::Session<S>,
}

#[async_trait]
impl<S: AsyncRead + AsyncWrite + Unpin + Debug + Send + Sync> Refresher<MailBoxList>
    for BoxListRefresher<'_, S>
{
    async fn refresh(&mut self) -> Result<MailBoxList> {
        let mut mailbox_stream = self.session.list(None, Some("*")).await?;

        // A planar graph of all of the mailboxes in the users account
        let mut mailboxes_planar: Vec<MailBox> = Vec::new();

        while let Some(mailbox) = mailbox_stream.next().await {
            if let Ok(mailbox) = mailbox {
                mailboxes_planar.push(MailBox::from(mailbox));
            }
        }

        let boxes = MailBoxList::new(mailboxes_planar);

        Ok(boxes)
    }
}

pub struct ImapClient<S: AsyncRead + AsyncWrite + Unpin + Debug + Send> {
    client: async_imap::Client<S>,
}

pub struct ImapSession<S: AsyncWrite + AsyncRead + Unpin + Debug + Send + Sync> {
    session: async_imap::Session<S>,
    box_list: Cache<MailBoxList>,
    /// The currently selected box' id.
    selected_box: Option<String>,
}

pub async fn connect<S: AsRef<str>, P: Into<u16>>(
    server: S,
    port: P,
) -> Result<ImapClient<TlsStream<TcpStream>>> {
    let tls = TlsConnector::new();

    let client = async_imap::connect((server.as_ref(), port.into()), server.as_ref(), tls).await?;

    let imap_client = ImapClient { client };

    Ok(imap_client)
}

pub async fn connect_plain<S: AsRef<str>, P: Into<u16>>(
    server: S,
    port: P,
) -> Result<ImapClient<TcpStream>> {
    let stream = TcpStream::connect((server.as_ref(), port.into())).await?;

    let client = async_imap::Client::new(stream);

    Ok(ImapClient { client })
}

impl<S: AsyncRead + AsyncWrite + Unpin + Debug + Send + Sync> ImapClient<S> {
    fn new_imap_session(session: async_imap::Session<S>) -> ImapSession<S> {
        let box_list_cache = Cache::new(Duration::from_secs(30));

        ImapSession {
            session,
            box_list: box_list_cache,
            selected_box: None,
        }
    }

    pub async fn login<T: AsRef<str>>(self, username: T, password: T) -> Result<ImapSession<S>> {
        let session = self
            .client
            .login(username, password)
            .await
            .map_err(|(error, _)| {
                Error::new(
                    ErrorKind::Imap(error),
                    "Failed to login to remote IMAP server using password",
                )
            })?;

        let imap_session = Self::new_imap_session(session);

        Ok(imap_session)
    }

    pub async fn oauth2_login(self, login: OAuthCredentials) -> Result<ImapSession<S>> {
        let session = self
            .client
            .authenticate("XOAUTH2", login)
            .await
            .map_err(|(error, _)| {
                Error::new(
                    ErrorKind::Imap(error),
                    "Failed to login to remote IMAP server using oauth",
                )
            })?;

        let imap_session = Self::new_imap_session(session);

        Ok(imap_session)
    }
}

impl<S: AsyncRead + AsyncWrite + Unpin + Debug + Send + Sync> ImapSession<S> {
    fn get_session_mut(&mut self) -> &mut async_imap::Session<S> {
        &mut self.session
    }

    async fn get_mail_box_list(&mut self) -> Result<&MailBoxList> {
        let mut refresher = BoxListRefresher {
            session: &mut self.session,
        };

        let mail_box_list = self.box_list.get(&mut refresher).await?;

        Ok(mail_box_list)
    }

    /// Given an array of fetches that is expected to have length 1, return that one fetch and error if it has more or less than 1 items.
    fn get_item_from_fetch_else_err<'a>(fetched: &'a Vec<ImapFetch>) -> Result<&'a ImapFetch> {
        if fetched.len() == 0 {
            return Err(Error::new(
                ErrorKind::UnexpectedBehavior,
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
    async fn box_is_selectable_else_err(&mut self, box_id: &str) -> Result<()> {
        let box_list = self.get_mail_box_list().await?;

        let requested_box = box_list.get_box(box_id);

        match requested_box {
            Some(mailbox) => {
                if !mailbox.selectable() {
                    return Err(Error::new(
                        ErrorKind::MailServer,
                        format!("The mailbox with id '{}' is not selectable", box_id),
                    ));
                }
            }
            None => {}
        }

        Ok(())
    }

    /// Select a given box if it hasn't already been selected, otherwise return the already selected box.
    async fn select(&mut self, box_id: &str) -> Result<&MailBox> {
        let box_id = box_id.trim();

        let box_is_selected_already = self.selected_box.is_some();

        // If there is no box selected yet or the box we have selected is not the box when want to select, we have to request the server.
        if !box_is_selected_already || self.selected_box.as_ref().unwrap() != box_id {
            let session = self.get_session_mut();

            // If there is already a box selected we must close it first
            if box_is_selected_already {
                session.close().await?;
            }

            session.select(&box_id).await?;

            self.selected_box = Some(String::from(box_id))
        };

        let box_list = self.get_mail_box_list().await?;

        if let Some(found_box) = box_list.get_box(&box_id) {
            Ok(found_box)
        } else {
            Err(Error::new(
                ErrorKind::MailBoxNotFound,
                "Could not find a mailbox with that id",
            ))
        }
    }
}

#[async_trait]
impl<S: AsyncRead + AsyncWrite + Unpin + Debug + Send + Sync> IncomingSession for ImapSession<S> {
    async fn logout(&mut self) -> Result<()> {
        let session = self.get_session_mut();

        session.logout().await?;

        Ok(())
    }

    async fn box_list(&mut self) -> Result<&Vec<MailBox>> {
        let mailbox_list = self.get_mail_box_list().await?;

        Ok(mailbox_list.get_vec())
    }

    async fn get(&mut self, box_id: &str) -> Result<&MailBox> {
        let box_id = box_id.trim().to_ascii_lowercase();

        let box_list = self.get_mail_box_list().await?;

        match box_list.get_box(&box_id) {
            Some(found_mailbox) => Ok(found_mailbox),
            None => Err(Error::new(
                ErrorKind::MailBoxNotFound,
                format!("Could not find a mailbox with id '{}'", &box_id),
            )),
        }
    }

    async fn delete(&mut self, box_id: &str) -> Result<()> {
        let session = self.get_session_mut();

        session.delete(box_id).await?;

        Ok(())
    }

    async fn rename(&mut self, box_id: &str, new_name: &str) -> Result<()> {
        let mailbox = self.get(box_id).await?;

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

        session.close().await?;

        session.rename(box_id, &new_name).await?;

        Ok(())
    }

    async fn create(&mut self, box_id: &str) -> Result<()> {
        let session = self.get_session_mut();

        session.create(box_id).await?;

        Ok(())
    }

    async fn messages(&mut self, box_id: &str, start: u32, end: u32) -> Result<Vec<Preview>> {
        self.box_is_selectable_else_err(box_id).await?;

        let selected_box = self.select(&box_id).await?;

        if let Some(counts) = selected_box.counts() {
            let total_messages = *counts.total();

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

            let mut preview_stream = session.fetch(sequence, QUERY_PREVIEW).await?;

            let mut previews: Vec<Preview> = Vec::new();

            while let Some(fetch) = preview_stream.next().await {
                let fetch = fetch?;

                let preview = parse::fetch_to_preview(&fetch)?;

                previews.push(preview);
            }

            Ok(previews)
        } else {
            Ok(Vec::new())
        }
    }

    async fn get_message(&mut self, box_id: &str, msg_id: &str) -> Result<Message> {
        self.box_is_selectable_else_err(box_id).await?;

        self.select(box_id).await?;

        let session = self.get_session_mut();

        let mut fetch_stream = session.uid_fetch(msg_id, QUERY_FULL_MESSAGE).await?;

        let mut fetched = Vec::new();

        while let Some(fetch) = fetch_stream.next().await {
            let fetch = fetch?;

            let uid = match &fetch.uid {
                Some(uid) => uid,
                // Only returns None when the UID parameter is not specified.
                None => unreachable!(),
            };

            let msg_id: u32 = msg_id.parse().map_err(|_| {
                Error::new(
                    ErrorKind::ParseString,
                    "Failed to parse imap message uid to u32",
                )
            })?;

            // Only add the fetches that match our uid
            if uid == &msg_id {
                fetched.push(fetch);
            }
        }

        let fetch = Self::get_item_from_fetch_else_err(&fetched)?;

        parse::fetch_to_message(fetch).await
    }
}

#[cfg(test)]
mod tests {
    use async_native_tls::TlsStream;

    use tokio::net::TcpStream;

    use super::ImapSession;

    use crate::client::incoming::IncomingSession;

    use dotenv::dotenv;

    use std::env;

    async fn create_test_session() -> ImapSession<TlsStream<TcpStream>> {
        dotenv().ok();

        let username = env::var("IMAP_USERNAME").unwrap();
        let password = env::var("IMAP_PASSWORD").unwrap();

        let server = env::var("IMAP_SERVER").unwrap();
        let port: u16 = 993;

        let client = super::connect(server, port).await.unwrap();

        let session = client.login(&username, &password).await.unwrap();

        session
    }

    #[tokio::test]
    async fn login() {
        let mut session = create_test_session().await;

        session.logout().await.unwrap();
    }

    #[tokio::test]
    async fn get_mailbox() {
        let mut session = create_test_session().await;

        let box_name = "Web";

        let mailbox = session.get(box_name).await.unwrap();

        println!("{:?}", mailbox);

        session.logout().await.unwrap();
    }

    #[tokio::test]
    async fn get_messages() {
        let mut session = create_test_session().await;

        let box_name = "INBOX";

        let messages = session.messages(box_name, 0, 10).await.unwrap();

        for preview in messages.into_iter() {
            println!("{}", preview.sent().unwrap());
        }

        session.logout().await.unwrap();
    }

    #[tokio::test]
    async fn get_box_list() {
        let mut session = create_test_session().await;

        let box_list = session.box_list().await.unwrap();

        for mailbox in box_list {
            println!("{}", mailbox.id());
        }

        session.logout().await.unwrap();
    }

    #[tokio::test]
    async fn get_message() {
        let mut session = create_test_session().await;

        let msg_id = "1113";
        let box_id = "INBOX";

        let message = session.get_message(box_id, msg_id).await.unwrap();

        println!("{}", message.content().text().unwrap());

        session.logout().await.unwrap();
    }

    #[tokio::test]
    async fn rename_box() {
        let mut session = create_test_session().await;

        let new_box_name = "Delivery";
        let box_id = "Test";

        session.rename(box_id, new_box_name).await.unwrap();

        session.logout().await.unwrap();
    }
}

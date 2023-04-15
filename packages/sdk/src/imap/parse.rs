use std::{borrow::Cow, collections::HashMap};

use async_imap::types::{
    Fetch,
    Flag as ImapFlag,
    //  Mailbox as ImapCounts,
};

use crate::{
    parse::{parse_headers, parse_rfc822},
    types::{Address, Content, Error, ErrorKind, Flag, Headers, Message, Preview, Result},
};

fn bytes_to_string<'a>(bytes: &Option<Cow<'a, [u8]>>) -> Option<String> {
    match bytes {
        Some(bytes) => Some(std::str::from_utf8(&bytes).ok()?.to_string()),
        None => None,
    }
}

fn address_to_string(
    mailbox: &Option<Cow<'_, [u8]>>,
    host: &Option<Cow<'_, [u8]>>,
) -> Option<String> {
    let mailbox_string = bytes_to_string(mailbox)?;
    let host_string = bytes_to_string(host)?;

    Some(format!("{}@{}", mailbox_string, host_string))
}

fn parse_uid(uid: Option<u32>) -> Result<String> {
    match uid {
        Some(id) => Ok(id.to_string()),
        None => Err(Error::new(
            ErrorKind::Unsupported,
            "Message must have a unique identifier",
        )),
    }
}

fn imap_flags_to_flags<'a, I: Iterator<Item = ImapFlag<'a>>>(imap_flag: I) -> Vec<Flag> {
    imap_flag
        .filter_map(|flag| {
            let flag = match flag {
                ImapFlag::Seen => Some(Flag::Read),
                ImapFlag::Answered => Some(Flag::Answered),
                ImapFlag::Draft => Some(Flag::Draft),
                ImapFlag::Flagged => Some(Flag::Flagged),
                ImapFlag::Deleted => Some(Flag::Deleted),
                ImapFlag::Custom(value) => Some(Flag::Custom(Some(value.to_string()))),
                _ => None,
            };

            flag
        })
        .collect()
}

pub fn fetch_to_preview(fetch: &Fetch) -> Result<Preview> {
    let id = match parse_uid(fetch.uid) {
        Ok(uid) => uid,
        Err(err) => return Err(err),
    };

    let envelope = match fetch.envelope() {
        Some(envelope) => envelope,
        None => {
            return Err(Error::new(
                ErrorKind::InvalidMessage,
                format!("Message with id '{}' does not contain an envelope", id),
            ))
        }
    };

    let flags = imap_flags_to_flags(fetch.flags());

    let sent = match fetch.internal_date() {
        Some(date) => Some(date.timestamp()),
        None => None,
    };

    let from = match envelope.from.as_ref() {
        Some(from) => from
            .iter()
            .map(|address| {
                let name = bytes_to_string(&address.name);
                let address = address_to_string(&address.mailbox, &address.host);

                Address::new(name, address)
            })
            .collect(),
        None => Vec::new(),
    };

    let subject = bytes_to_string(&envelope.subject);

    let preview = Preview::new(from, flags, id, sent, subject);

    Ok(preview)
}

pub async fn fetch_to_message(fetch: &Fetch) -> Result<Message> {
    let envelope = fetch.envelope().unwrap();

    let flags = imap_flags_to_flags(fetch.flags());

    let sent = match fetch.internal_date() {
        Some(date) => Some(date.timestamp()),
        None => None,
    };

    let from = match envelope.from.as_ref() {
        Some(from) => from
            .iter()
            .map(|address| {
                let name = bytes_to_string(&address.name);
                let address = address_to_string(&address.mailbox, &address.host);

                Address::new(name, address)
            })
            .collect(),
        None => Vec::new(),
    };

    let to = match envelope.to.as_ref() {
        Some(to) => to
            .iter()
            .map(|address| {
                let name = bytes_to_string(&address.name);
                let address = address_to_string(&address.mailbox, &address.host);

                Address::new(name, address)
            })
            .collect(),
        None => Vec::new(),
    };

    let cc = match envelope.cc.as_ref() {
        Some(cc) => cc
            .iter()
            .map(|address| {
                let name = bytes_to_string(&address.name);
                let address = address_to_string(&address.mailbox, &address.host);

                Address::new(name, address)
            })
            .collect(),
        None => Vec::new(),
    };

    let bcc = match envelope.bcc.as_ref() {
        Some(bcc) => bcc
            .iter()
            .map(|address| {
                let name = bytes_to_string(&address.name);
                let address = address_to_string(&address.mailbox, &address.host);

                Address::new(name, address)
            })
            .collect(),
        None => Vec::new(),
    };

    let subject = bytes_to_string(&envelope.subject);

    let id = match parse_uid(fetch.uid) {
        Ok(uid) => uid,
        Err(err) => return Err(err),
    };

    let (content, headers): (Content, Headers) = match fetch.body() {
        Some(body) => {
            let content = parse_rfc822(body).await?;
            let headers = parse_headers(body)?;

            (content, headers)
        }
        None => (Content::new(None, None), HashMap::new()),
    };

    let message = Message::new(
        from, to, cc, bcc, headers, flags, id, sent, subject, content,
    );

    Ok(message)
}

// Given a mailboxes id on the server and the delimiter assigned to that box, give that last item that is created when the id is splitted on the delimiter.
// pub fn name_from_box_id(id: &str, delimiter: Option<&str>) -> String {
//     match delimiter {
//         Some(delimiter) => {
//             let split = id.split(delimiter);

//             split.last().unwrap().to_owned()
//         }
//         None => id.to_owned(),
//     }
// }

// fn counts_from_imap_counts(imap_counts: &Option<ImapCounts>) -> Option<Counts> {
//     imap_counts
//         .as_ref()
//         .map(|imap_counts| Counts::new(imap_counts.unseen.unwrap_or(0), imap_counts.exists))
// }

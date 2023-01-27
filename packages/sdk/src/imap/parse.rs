use std::collections::HashMap;

use imap::types::{Fetch, Flag as ImapFlag};

use crate::{
    parse::{parse_headers, parse_rfc822},
    types::{self, Address, Content, Flag, Headers, Message, Preview},
};

const AT_SYMBOL: u8 = 64;

fn bytes_to_string(bytes: &Option<&[u8]>) -> Option<String> {
    match bytes {
        Some(bytes) => Some(String::from_utf8_lossy(bytes).to_string()),
        None => None,
    }
}

fn address_to_string(mailbox: Option<&[u8]>, host: Option<&[u8]>) -> Option<String> {
    vec![mailbox, Some(&[AT_SYMBOL]), host]
        .iter()
        .map(bytes_to_string)
        .collect()
}

fn parse_uid(uid: Option<u32>) -> types::Result<String> {
    match uid {
        Some(id) => Ok(id.to_string()),
        None => Err(types::Error::new(
            types::ErrorKind::Unsupported,
            "Message must have a unique identifier",
        )),
    }
}

///
fn imap_flags_to_flags(imap_flags: &[ImapFlag]) -> Vec<Flag> {
    imap_flags
        .iter()
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

pub fn fetch_to_preview(fetch: &Fetch) -> types::Result<Preview> {
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
                let address = address_to_string(address.mailbox, address.host);

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

    let preview = Preview::new(from, flags, id, sent, subject);

    Ok(preview)
}

pub fn fetch_to_message(fetch: &Fetch) -> types::Result<Message> {
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
                let address = address_to_string(address.mailbox, address.host);

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
                let address = address_to_string(address.mailbox, address.host);

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
                let address = address_to_string(address.mailbox, address.host);

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
                let address = address_to_string(address.mailbox, address.host);

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
            let content = parse_rfc822(body)?;
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

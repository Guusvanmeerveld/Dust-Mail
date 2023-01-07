use imap::types::Fetch;

use crate::{
    parse::parse_rfc822,
    types::{self, Address, Content, Message, Preview},
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

pub fn fetch_to_preview(fetch: &Fetch) -> types::Result<Preview> {
    let envelope = fetch.envelope().unwrap();

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

    let preview = Preview {
        from,
        id,
        sent,
        subject,
    };

    Ok(preview)
}

pub fn fetch_to_message(fetch: &Fetch) -> types::Result<Message> {
    let envelope = fetch.envelope().unwrap();

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

    let content: Content = match fetch.body() {
        Some(body) => parse_rfc822(body)?,
        None => Content {
            html: None,
            text: None,
        },
    };

    let message = Message {
        from,
        to,
        cc,
        bcc,
        id,
        sent,
        subject,
        content,
    };

    Ok(message)
}

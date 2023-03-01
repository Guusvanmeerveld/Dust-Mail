use std::collections::HashMap;

use imap::types::{
    Fetch,
    Flag as ImapFlag,
    //  Mailbox as ImapCounts,
    Name as ImapBox,
    NameAttribute as ImapBoxAttribute,
};

use crate::{
    parse::{parse_headers, parse_rfc822},
    types::{
        Address, Content, Counts, Error, ErrorKind, Flag, Headers, MailBox, Message, Preview,
        Result,
    },
};

use super::types::MailBoxTree;

const AT_SYMBOL: u8 = 64;

fn bytes_to_string(bytes: &Option<&[u8]>) -> Option<String> {
    match bytes {
        Some(bytes) => String::from_utf8(bytes.to_vec()).ok(),
        None => None,
    }
}

fn address_to_string(mailbox: Option<&[u8]>, host: Option<&[u8]>) -> Option<String> {
    vec![mailbox, Some(&[AT_SYMBOL]), host]
        .iter()
        .map(bytes_to_string)
        .collect()
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

pub fn fetch_to_preview(fetch: &Fetch) -> Result<Preview> {
    let id = match parse_uid(fetch.uid) {
        Ok(uid) => uid,
        Err(err) => return Err(err),
    };

    let envelope = match fetch.envelope() {
        Some(envelope) => envelope,
        None => {
            return Err(Error::new(
                ErrorKind::ParseMessage,
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
                let address = address_to_string(address.mailbox, address.host);

                Address::new(name, address)
            })
            .collect(),
        None => Vec::new(),
    };

    let subject = bytes_to_string(&envelope.subject);

    let preview = Preview::new(from, flags, id, sent, subject);

    Ok(preview)
}

pub fn fetch_to_message(fetch: &Fetch) -> Result<Message> {
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

/// Given a mailboxes id on the server and the delimiter assigned to that box, give that last item that is created when the id is splitted on the delimiter.
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

/// This is a function that takes an array of mailbox names and builds it into a folder tree of mailboxes.
/// In the case that there is a mailbox present that has children, the children must also be present in the given array of mailboxes.
pub fn get_boxes_from_names(imap_boxes: &Vec<(&ImapBox, Option<Counts>)>) -> Vec<MailBox> {
    let mut folders: HashMap<String, MailBoxTree> = HashMap::new();

    for (folder, counts) in imap_boxes {
        match folder.delimiter() {
            Some(delimiter) => {
                let parts: Vec<_> = folder.name().split(delimiter).collect();

                let mut current: Option<&mut MailBoxTree> = None;

                for part in parts {
                    let id = match current.as_ref() {
                        Some(current) => {
                            format!("{}{}{}", current.id(), delimiter, part)
                        }
                        None => String::from(part),
                    };

                    let children = match current {
                        Some(current_box) => current_box.children_mut(),
                        None => &mut folders,
                    };

                    let current_box = imap_boxes
                        .iter()
                        .find(|(imap_box, _)| imap_box.name() == &id);

                    let selectable = !current_box
                        .map(|(current_box, _)| {
                            current_box
                                .attributes()
                                .contains(&ImapBoxAttribute::NoSelect)
                        })
                        .unwrap_or(false);

                    let counts = current_box
                        .map(|current_box| current_box.1.clone())
                        .unwrap_or(Some(Counts::new(0, 0)));

                    current = Some(
                        children
                            .entry(String::from(part))
                            .or_insert(MailBoxTree::new(
                                counts,
                                Some(String::from(delimiter)),
                                HashMap::new(),
                                selectable,
                                id.as_str(),
                                part,
                            )),
                    );
                }
            }
            None => {
                let id = folder.name().to_string();

                let selectable = !folder.attributes().contains(&ImapBoxAttribute::NoSelect);

                folders.insert(
                    id.clone(),
                    MailBoxTree::new(counts.clone(), None, HashMap::new(), selectable, &id, &id),
                );
            }
        }
    }

    folders.into_iter().map(|(_, value)| value.into()).collect()
}

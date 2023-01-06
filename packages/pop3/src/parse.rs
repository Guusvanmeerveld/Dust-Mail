use std::{io, net::TcpStream};

use crate::{
    constants::{LF, SPACE},
    types::{self, ListItem, Stats, UniqueID},
};

/// A simple struct to parse responses from the server
pub struct Parser {
    /// The response message that needs to be parsed
    response: String,
}

impl Parser {
    pub fn new(response: String) -> Self {
        Self { response }
    }

    /// Parse the message count and drop size from a given string
    fn parse_counts_from_string(string: &str) -> (u32, u64) {
        let mut split = string.split(SPACE);

        let message_count: u32 = split.next().unwrap().trim().parse().unwrap();

        let drop_size: u64 = split.next().unwrap().trim().parse().unwrap();

        (message_count, drop_size)
    }

    pub fn to_stats(&self) -> Stats {
        let (message_count, drop_size) = Self::parse_counts_from_string(&self.response);

        Stats::new(message_count, drop_size)
    }

    pub fn to_list_item(&self) -> ListItem {
        let (index, byte_count) = Self::parse_counts_from_string(&self.response);

        ListItem::new(index, byte_count)
    }

    pub fn to_list(&self) -> Vec<ListItem> {
        let end_of_line = char::from_u32(LF as u32).unwrap();

        let split = self.response.split(end_of_line).filter(|s| s.len() != 0);

        split
            .map(|line| {
                let (message_index, byte_count) = Self::parse_counts_from_string(line);

                ListItem::new(message_index, byte_count)
            })
            .collect()
    }

    fn parse_unique_id_from_string(string: &str) -> UniqueID {
        let mut split = string.split(SPACE);

        let msg_id: u32 = split.next().unwrap().trim().parse().unwrap();

        let unique_id = split.next().unwrap().to_owned();

        (msg_id, unique_id)
    }

    pub fn to_unique_id(&self) -> UniqueID {
        Self::parse_unique_id_from_string(&self.response)
    }

    pub fn to_unique_id_list(&self) -> Vec<UniqueID> {
        let end_of_line = char::from_u32(LF as u32).unwrap();

        let split = self.response.split(end_of_line).filter(|s| s.len() != 0);

        split
            .map(|line| Self::parse_unique_id_from_string(line))
            .collect()
    }
}

pub fn map_native_tls_error(error: native_tls::HandshakeError<TcpStream>) -> types::Error {
    types::Error::new(types::ErrorKind::Tls, error.to_string())
}

pub fn map_write_error_to_error(write_error: io::Error) -> types::Error {
    types::Error::new(
        types::ErrorKind::Write,
        format!("Failed to send command: {}", write_error.to_string()),
    )
}

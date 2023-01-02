use crate::{
    socket::LF,
    types::{ListItem, Stats},
};

const SPACE: char = ' ';

// A simple struct to parse responses from the server
pub struct Parser {
    response: String,
}

impl Parser {
    pub fn new(response: String) -> Self {
        Self { response }
    }

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
            .map(|drop| {
                let (message_index, byte_count) = Self::parse_counts_from_string(drop);

                ListItem::new(message_index, byte_count)
            })
            .collect()
    }
}

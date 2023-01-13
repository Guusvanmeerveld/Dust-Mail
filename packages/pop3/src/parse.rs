use std::{
    io,
    net::{SocketAddr, TcpStream, ToSocketAddrs},
    time::Duration,
};

use crate::{
    constants::{LF, SPACE},
    types::{self, Capabilities, Capability, Stats, UniqueID},
};

/// A simple struct to parse responses from the server
pub struct Parser {
    /// The response message that needs to be parsed
    response: String,
}

impl Parser {
    pub fn new<S: Into<String>>(response: S) -> Self {
        Self {
            response: response.into(),
        }
    }

    /// Parse the message count and drop size from a given string
    fn parse_counts_from_string(string: &str) -> (u32, u64) {
        let mut split = string.split(SPACE);

        let message_count: u32 = split.next().unwrap().trim().parse().unwrap();

        let drop_size: u64 = split.next().unwrap().trim().parse().unwrap();

        (message_count, drop_size)
    }

    pub fn to_stats(&self) -> Stats {
        Self::parse_counts_from_string(&self.response)
    }

    pub fn to_stats_list(&self) -> Vec<Stats> {
        let end_of_line = char::from_u32(LF as u32).unwrap();

        let split = self.response.split(end_of_line).filter(|s| s.len() != 0);

        split.map(Self::parse_counts_from_string).collect()
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

pub fn parse_socket_address<A: ToSocketAddrs>(addr: A) -> types::Result<SocketAddr> {
    Ok(addr
        .to_socket_addrs()
        .map_err(|e| {
            types::Error::new(
                types::ErrorKind::Read,
                format!("Failed to parse given address: {}", e),
            )
        })?
        .next()
        .unwrap())
}

pub fn parse_capabilities<S: Into<String>>(response: S) -> Capabilities {
    let response: String = response.into();

    let end_of_line = char::from_u32(LF as u32).unwrap();

    let split = response.split(end_of_line);

    split
        .map(|line| {
            let line = line.trim().to_ascii_uppercase();

            let mut split = line.split(SPACE);

            match split.next().unwrap() {
                "TOP" => Some(Capability::Top),
                "USER" => Some(Capability::User),
                "SASL" => {
                    let arguments: Vec<String> = split.map(|s| s.to_owned()).collect();

                    Some(Capability::Sasl(arguments))
                }
                "RESP-CODES" => Some(Capability::RespCodes),
                "LOGIN-DELAY" => {
                    let delay: Duration = match split.next() {
                        Some(delay) => Duration::from_secs(delay.parse::<u64>().unwrap()),
                        None => Duration::from_secs(0),
                    };

                    Some(Capability::LoginDelay(delay))
                }
                "PIPELINING" => Some(Capability::Pipelining),
                "EXPIRE" => {
                    let expires: Option<Duration> = match split.next() {
                        Some(expires) => Some(Duration::from_secs(expires.parse::<u64>().unwrap())),
                        None => None,
                    };

                    Some(Capability::Expire(expires))
                }
                "UIDL" => Some(Capability::Uidl),
                "IMPLEMENTATION" => {
                    let arguments: String = split.map(|s| s.to_owned()).collect();

                    Some(Capability::Implementation(arguments))
                }
                _ => None,
            }
        })
        .collect::<Capabilities>()
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

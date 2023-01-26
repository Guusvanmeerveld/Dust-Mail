use std::io::{Read, Write};

use bufstream::BufStream;

use crate::{
    constants::{DOT, END_OF_LINE, EOF, ERR, LF, OK},
    parse::map_write_error_to_error,
    types,
};

pub struct Socket<T: Read + Write> {
    stream: BufStream<T>,
}

impl<T: Read + Write> Socket<T> {
    pub fn new(stream: T) -> Socket<T> {
        Self {
            stream: BufStream::new(stream),
        }
    }

    pub fn send_command(&mut self, command: &[u8]) -> types::Result<String> {
        self.send_bytes(command)?;

        self.read_response()
    }

    pub fn read_response_from_string(&mut self, response: String) -> types::Result<String> {
        if response.len() < OK.len() {
            return Err(types::Error::new(
                types::ErrorKind::InvalidResponse,
                "Response is too short",
            ));
        };

        if response.starts_with(OK) {
            let ok_size = OK.len() + 1;

            let left_over = response.get(ok_size..).unwrap();

            Ok(left_over.to_owned())
        } else if response.starts_with(ERR) {
            let left_over = response.get((ERR.len() + 1)..).unwrap();

            Err(types::Error::new(
                types::ErrorKind::ServerError,
                format!("Server error: {}", left_over),
            ))
        } else {
            Err(types::Error::new(
                types::ErrorKind::InvalidResponse,
                format!("Response is invalid: '{}'", response),
            ))
        }
    }

    pub fn read_response(&mut self) -> types::Result<String> {
        let mut response: Vec<u8> = Vec::new();

        self.read_line(&mut response)?;

        let response_string = String::from_utf8(response).unwrap();

        self.read_response_from_string(response_string)
    }

    pub fn read_multi_line(&mut self, buf: &mut Vec<u8>) -> types::Result<usize> {
        let mut total_bytes_read: usize = 0;

        loop {
            let bytes_read = self.read_line(buf)?;

            total_bytes_read += bytes_read;

            let start_of_line = buf.len().saturating_sub(bytes_read);

            // Get the first three characters of the current line
            match buf.get(start_of_line..start_of_line.saturating_add(3)) {
                Some(first_three_chars) => {
                    // If the first character is a DOT and the latter two are not CR and LF, then the line is byte-stuffed and the DOT should be removed
                    if first_three_chars.first().unwrap() == &DOT {
                        let latter_two_chars = &first_three_chars[1..];

                        if latter_two_chars != END_OF_LINE {
                            buf.remove(start_of_line);
                        }
                    }
                }
                None => {}
            };

            let last_five_bytes = buf.get(buf.len() - 5..).unwrap();

            if last_five_bytes == EOF {
                // Remove the last 3 bytes which should be `[DOT, CR, LF]` as they are not part of the message
                buf.truncate(buf.len().saturating_sub(3));

                return Ok(total_bytes_read);
            };
        }
    }

    pub fn read_line(&mut self, buf: &mut Vec<u8>) -> types::Result<usize> {
        use std::io::BufRead;

        match self.stream.read_until(LF, buf) {
            Ok(bytes_read) => {
                if bytes_read == 0 {
                    return Err(types::Error::new(
                        types::ErrorKind::NoResponse,
                        "Server did not send any bytes",
                    ));
                }

                Ok(bytes_read)
            }
            Err(err) => Err(types::Error::new(
                types::ErrorKind::InvalidResponse,
                format!("Failed to read server response: {}", err.to_string()),
            )),
        }
    }

    pub fn send_bytes(&mut self, buf: &[u8]) -> types::Result<()> {
        self.stream
            .write_all(buf)
            .map_err(map_write_error_to_error)?;

        self.stream
            .write_all(&END_OF_LINE)
            .map_err(map_write_error_to_error)?;

        self.stream.flush().map_err(map_write_error_to_error)
    }
}

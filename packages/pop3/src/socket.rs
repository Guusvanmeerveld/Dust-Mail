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
        match self.send_bytes(command) {
            Ok(_) => match self.read_response() {
                Ok(response) => Ok(response),
                Err(err) => Err(err),
            },
            Err(err) => Err(err),
        }
    }

    pub fn read_response_from_string(&mut self, response: String) -> types::Result<String> {
        if response.len() < OK.len() {
            return Err(types::Error::new(
                types::ErrorKind::Read,
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
                types::ErrorKind::Server,
                format!("Server error: {}", left_over),
            ))
        } else {
            Err(types::Error::new(
                types::ErrorKind::Read,
                format!("Response is invalid: '{}'", response),
            ))
        }
    }

    pub fn read_response(&mut self) -> types::Result<String> {
        let mut response: Vec<u8> = Vec::new();

        match self.read_line(&mut response) {
            Ok(_) => {
                let response_string = String::from_utf8(response).unwrap();

                self.read_response_from_string(response_string)
            }
            Err(err) => Err(err),
        }
    }

    pub fn read_multi_line(&mut self, buf: &mut Vec<u8>) -> types::Result<usize> {
        let mut total_bytes_read: usize = 0;

        loop {
            let read_result = self.read_line(buf);

            if read_result.is_err() {
                return read_result;
            }

            let bytes_read = read_result.unwrap();

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
                        types::ErrorKind::Read,
                        "Server did not send any bytes",
                    ));
                }

                Ok(bytes_read)
            }
            Err(err) => Err(types::Error::new(
                types::ErrorKind::Read,
                format!("Failed to read server response: {}", err.to_string()),
            )),
        }
    }

    pub fn send_bytes(&mut self, buf: &[u8]) -> types::Result<()> {
        match self.stream.write_all(buf).map_err(map_write_error_to_error) {
            Ok(_) => {}
            Err(err) => return Err(err),
        };

        match self
            .stream
            .write_all(&END_OF_LINE)
            .map_err(map_write_error_to_error)
        {
            Ok(_) => {}
            Err(err) => return Err(err),
        };

        self.stream.flush().map_err(map_write_error_to_error)
    }
}

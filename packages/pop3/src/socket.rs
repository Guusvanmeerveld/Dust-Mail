use std::io::{Read, Write};

use bufstream::BufStream;

use crate::{
    constants::{DOT, END_OF_LINE, EOF, LF},
    parse::{map_write_error_to_error, parse_server_response, parse_utf8_bytes},
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

    pub fn send_command(
        &mut self,
        command: &[u8],
        multi_line_response: bool,
    ) -> types::Result<String> {
        self.send_bytes(command)?;

        self.read_response(multi_line_response)
    }

    pub fn read_response(&mut self, multi_line_response: bool) -> types::Result<String> {
        let mut response: Vec<u8> = Vec::new();

        if multi_line_response {
            self.read_multi_line(&mut response)?;

            let line_break_index = response
                .iter()
                .position(|item| item == &LF)
                .unwrap_or(response.len());

            let status_response = match response.get(..line_break_index) {
                Some(bytes) => parse_utf8_bytes(Vec::from(bytes))?,
                None => String::new(),
            };

            parse_server_response(&status_response)?;

            match response.get(line_break_index..) {
                Some(bytes) => parse_utf8_bytes(Vec::from(bytes)),
                None => Ok(String::new()),
            }
        } else {
            self.read_line(&mut response)?;

            let response = parse_utf8_bytes(response)?;

            parse_server_response(&response).map(|response| response.to_string())
        }
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

            let last_five_bytes = buf.get(buf.len().saturating_sub(5)..).unwrap();

            if last_five_bytes == EOF {
                // Remove the last 3 bytes which should be `[DOT, CR, LF]` as they are not part of the message
                buf.truncate(buf.len().saturating_sub(3));

                return Ok(total_bytes_read);
            };
        }
    }

    fn read_line(&mut self, buf: &mut Vec<u8>) -> types::Result<usize> {
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

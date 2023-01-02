use std::io::{self, Read, Write};

use bufstream::BufStream;

pub const LF: u8 = 0x0a;
pub const CR: u8 = 0x0d;

const OK: &str = "+OK";
const ERR: &str = "-ERR";

const DOT: u8 = 0x2e;

const END_OF_LINE: [u8; 2] = [CR, LF];
const EOF: [u8; 5] = [CR, LF, DOT, CR, LF];

pub struct Socket<T: Read + Write> {
    stream: BufStream<T>,
}

impl<T: Read + Write> Socket<T> {
    pub fn new(stream: T) -> Socket<T> {
        Self {
            stream: BufStream::new(stream),
        }
    }

    pub fn send_command(&mut self, command: &[u8]) -> io::Result<Result<String, String>> {
        match self.send_bytes(command) {
            Ok(_) => match self.read_response() {
                Ok(response) => Ok(response),
                Err(err) => Err(err),
            },
            Err(err) => Err(err),
        }
    }

    pub fn read_response_from_string(
        &mut self,
        response: String,
    ) -> io::Result<Result<String, String>> {
        if response.len() < OK.len() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Response is too short",
            ));
        };

        if response.starts_with(OK) {
            let left_over = response.get(OK.len() + 1..).unwrap();

            Ok(Ok(left_over.to_owned()))
        } else if response.starts_with(ERR) {
            let left_over = response.get(ERR.len() + 1..).unwrap();

            Ok(Err(left_over.to_owned()))
        } else {
            Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Response is invalid",
            ))
        }
    }

    pub fn read_response(&mut self) -> io::Result<Result<String, String>> {
        let mut response: Vec<u8> = Vec::new();

        match self.read_line(&mut response) {
            Ok(_) => {
                let response_string = String::from_utf8(response).unwrap();

                self.read_response_from_string(response_string)
            }
            Err(err) => Err(err),
        }
    }

    pub fn read_multi_line(&mut self, buf: &mut Vec<u8>) -> io::Result<usize> {
        let mut total_bytes_read: usize = 0;

        loop {
            let read_result = self.read_line(buf);

            if read_result.is_err() {
                return read_result;
            }

            let bytes_read = read_result.unwrap();

            total_bytes_read += bytes_read;

            let start_of_line = buf.len().saturating_sub(bytes_read);

            match buf.get(start_of_line..start_of_line.saturating_add(3)) {
                Some(first_three_chars) => {
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
                buf.truncate(buf.len().saturating_sub(3));

                return Ok(total_bytes_read);
            };
        }
    }

    pub fn read_line(&mut self, buf: &mut Vec<u8>) -> io::Result<usize> {
        use std::io::BufRead;

        match self.stream.read_until(LF, buf) {
            Ok(bytes_read) => {
                if bytes_read == 0 {
                    return Err(io::Error::new(
                        io::ErrorKind::ConnectionAborted,
                        "Server did not send any bytes",
                    ));
                }

                Ok(bytes_read)
            }
            Err(err) => Err(err),
        }
    }

    pub fn send_bytes(&mut self, buf: &[u8]) -> io::Result<()> {
        self.stream.write_all(buf).unwrap();
        self.stream.write_all(&END_OF_LINE).unwrap();
        self.stream.flush()
    }
}

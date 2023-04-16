use std::time::Duration;

use tokio::{
    io::{AsyncBufReadExt, AsyncRead, AsyncWrite, AsyncWriteExt, BufStream},
    time::timeout,
};

use crate::{
    constants::{DOT, END_OF_LINE, EOF, LF},
    parse::{parse_server_response, parse_utf8_bytes},
    types::{Error, ErrorKind, Result},
};

pub struct Socket<T: AsyncRead + AsyncWrite + Unpin> {
    timeout: Duration,
    stream: BufStream<T>,
}

impl<T: AsyncRead + AsyncWrite + Unpin> Socket<T> {
    const DEFAULT_RESPONSE_TIMEOUT: Duration = Duration::from_secs(5);

    pub fn new(stream: T, timeout: Option<Duration>) -> Socket<T> {
        Self {
            timeout: timeout.unwrap_or(Self::DEFAULT_RESPONSE_TIMEOUT),
            stream: BufStream::new(stream),
        }
    }

    /// Send a command to the server and read the response into a string.
    pub async fn send_command<C: AsRef<[u8]>>(
        &mut self,
        command: C,
        multi_line_response: bool,
    ) -> Result<String> {
        self.send_bytes(command.as_ref()).await?;

        self.read_response(multi_line_response).await
    }

    /// Reads a response from the server.
    pub async fn read_response(&mut self, multi_line_response: bool) -> Result<String> {
        let mut response: Vec<u8> = Vec::new();

        if multi_line_response {
            self.read_multi_line(&mut response).await?;

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
            self.read_line(&mut response).await?;

            let response = parse_utf8_bytes(response)?;

            parse_server_response(&response).map(|response| response.to_string())
        }
    }

    /// Read a multiline response and insert it into a given buffer.
    pub async fn read_multi_line(&mut self, buf: &mut Vec<u8>) -> Result<usize> {
        let mut total_bytes_read: usize = 0;

        loop {
            let bytes_read = self.read_line(buf).await?;

            if bytes_read < 1 {
                return Ok(bytes_read);
            }

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

    async fn read_line(&mut self, buf: &mut Vec<u8>) -> Result<usize> {
        match timeout(self.timeout, self.stream.read_until(LF, buf))
            .await
            .map_err(|_| {
                Error::new(
                    ErrorKind::InvalidResponse,
                    format!(
                        "Server did not respond with a valid response within {} seconds",
                        self.timeout.as_secs()
                    ),
                )
            })? {
            Ok(bytes_read) => {
                if bytes_read == 0 {
                    return Err(Error::new(
                        ErrorKind::NoResponse,
                        "Server did not send any bytes",
                    ));
                }

                Ok(bytes_read)
            }
            Err(err) => Err(Error::new(
                ErrorKind::InvalidResponse,
                format!("Failed to read server response: {}", err.to_string()),
            )),
        }
    }

    /// Send some bytes to the server
    pub async fn send_bytes(&mut self, buf: &[u8]) -> Result<()> {
        self.stream.write_all(buf).await?;

        self.stream.write_all(&END_OF_LINE).await?;

        self.stream.flush().await?;

        Ok(())
    }
}

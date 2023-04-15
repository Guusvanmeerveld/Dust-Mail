use async_native_tls::{TlsConnector, TlsStream};
pub use config::Config;
use constants::{CR, LF};
use tokio::{
    io::{AsyncBufReadExt, AsyncRead, AsyncWrite, AsyncWriteExt, BufStream},
    net::{TcpStream, ToSocketAddrs},
};

mod config;
mod constants;
pub mod types;

use types::{Error, ErrorKind, Result};

pub struct TcpClient<S: AsyncWrite + AsyncRead + Unpin> {
    stream: BufStream<S>,
    config: Config,
}

pub fn new<T: AsyncWrite + AsyncRead + Unpin>(stream: T, config: Config) -> TcpClient<T> {
    TcpClient {
        stream: BufStream::new(stream),
        config,
    }
}

/// Connects to a remote server in a secure manner using a given address and hostname, with a timeout duration.
pub async fn connect<A: ToSocketAddrs, H: AsRef<str>>(
    addr: A,
    host: H,
    config: Option<Config>,
) -> Result<TcpClient<TlsStream<TcpStream>>> {
    let config = config.unwrap_or_default();

    let tcp = tokio::time::timeout(config.timeout().clone(), TcpStream::connect(addr)).await??;

    let tls = TlsConnector::new();

    let stream = tls.connect(host.as_ref(), tcp).await?;

    let client = new(stream, config);

    Ok(client)
}

/// Connects to a remote server given address with a timeout duration.
pub async fn connect_plain<A: ToSocketAddrs>(
    addr: A,
    config: Option<Config>,
) -> Result<TcpClient<TcpStream>> {
    let config = config.unwrap_or_default();

    let stream = tokio::time::timeout(config.timeout().clone(), TcpStream::connect(addr)).await??;

    let client = new(stream, config);

    Ok(client)
}

impl<S: AsyncWrite + AsyncRead + Unpin> TcpClient<S> {
    /// Creates a new client using a given stream and timeout duration.

    /// Expects a single line response
    pub async fn send_command<C: AsRef<[u8]>>(&mut self, command: C) -> Result<String> {
        self.send_bytes(command).await?;

        let response = self.read_response().await?;

        Ok(response)
    }

    /// Write some bytes to the socket, end it off with a LF CR and send it to the remote server.
    pub async fn send_bytes<B: AsRef<[u8]>>(&mut self, bytes: B) -> Result<()> {
        self.stream.write_all(bytes.as_ref()).await?;
        self.stream.write_all(&[LF, CR]).await?;
        self.stream.flush().await?;

        Ok(())
    }

    /// Reads a single line response
    pub async fn read_response(&mut self) -> Result<String> {
        let mut response = String::new();

        let bytes_read = tokio::time::timeout(
            self.config.timeout().clone(),
            self.stream.read_line(&mut response),
        )
        .await??;

        if bytes_read < 1 {
            return Err(Error::new(
                ErrorKind::EmptyResponse,
                "Server did not send any bytes",
            ));
        }

        Ok(response)
    }

    pub async fn close(&mut self) -> Result<()> {
        self.stream.shutdown().await?;

        Ok(())
    }
}

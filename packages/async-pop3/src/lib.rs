mod constants;
mod parse;
mod socket;
pub mod types;
mod utils;

use async_native_tls::{TlsConnector, TlsStream};
use parse::{parse_capabilities, Parser};
use socket::Socket;

use tokio::{
    io::{AsyncRead, AsyncWrite},
    net::{TcpStream, ToSocketAddrs},
    time::{timeout, Duration},
};
use types::{
    Capabilities, Capability, Error, ErrorKind, Result, Stats, StatsResponse, UniqueIDResponse,
};

use utils::create_command;

#[derive(Eq, PartialEq, Debug)]
pub enum ClientState {
    Authentication,
    Transaction,
    Update,
    None,
}

pub struct Client<S: AsyncWrite + AsyncRead + Unpin> {
    socket: Option<Socket<S>>,
    capabilities: Capabilities,
    marked_as_del: Vec<u32>,
    greeting: Option<String>,
    read_greeting: bool,
    pub state: ClientState,
}

fn get_connection_timeout(timeout: Option<Duration>) -> Duration {
    match timeout {
        Some(timeout) => timeout,
        None => Duration::from_secs(60),
    }
}

/// Creates a client from a given socket connection.
async fn create_client_from_socket<S: AsyncRead + AsyncWrite + Unpin>(
    socket: Socket<S>,
) -> Result<Client<S>> {
    let mut client = Client {
        marked_as_del: Vec::new(),
        capabilities: Vec::new(),
        greeting: None,
        read_greeting: false,
        socket: Some(socket),
        state: ClientState::Authentication,
    };

    client.greeting = Some(client.read_greeting().await?);

    client.capabilities = client.capa().await?;

    Ok(client)
}

/// Creates a new pop3 client from an existing stream.
/// # Examples
/// ```rust
/// extern crate pop3;
/// use std::net::TcpStream;
///
/// fn main() {
///     // Not recommended to use plaintext, just an example.
///     let stream = TcpStream::connect(("outlook.office365.com", 110)).unwrap();
///
///     let mut client = pop3::new(stream).unwrap();
///
///     client.quit().unwrap();
/// }
/// ```
pub async fn new<S: AsyncRead + AsyncWrite + Unpin>(
    stream: S,
    timeout: Option<Duration>,
) -> Result<Client<S>> {
    let socket = Socket::new(stream, timeout);

    create_client_from_socket(socket).await
}

/// Create a new pop3 client with a tls connection.
pub async fn connect<A: ToSocketAddrs>(
    addr: A,
    domain: &str,
    tls_connector: &TlsConnector,
    connection_timeout: Option<Duration>,
) -> Result<Client<TlsStream<TcpStream>>> {
    let connection_timeout = get_connection_timeout(connection_timeout);

    let tcp_stream = timeout(connection_timeout, TcpStream::connect(addr)).await??;

    let tls_stream = tls_connector.connect(domain, tcp_stream).await?;

    let socket = Socket::new(tls_stream, None);

    create_client_from_socket(socket).await
}

/// Creates a new pop3 client using a plain connection.
///
/// DO NOT USE in a production environment. Your password will be sent over a plain tcp stream which hackers could intercept.
pub async fn connect_plain<A: ToSocketAddrs>(
    addr: A,
    connection_timeout: Option<Duration>,
) -> Result<Client<TcpStream>> {
    let connection_timeout = get_connection_timeout(connection_timeout);

    let tcp_stream = timeout(connection_timeout, TcpStream::connect(addr)).await??;

    let socket = Socket::new(tcp_stream, None);

    create_client_from_socket(socket).await
}

impl<S: AsyncRead + AsyncWrite + Unpin> Client<S> {
    /// Check if the client is in the correct state and return a mutable reference to the tcp connection.
    fn get_socket_mut(&mut self) -> Result<&mut Socket<S>> {
        match self.socket.as_mut() {
            Some(socket) => {
                if self.state == ClientState::Transaction
                    || self.state == ClientState::Authentication
                {
                    Ok(socket)
                } else {
                    Err(Error::new(
                        ErrorKind::ShouldNotBeConnected,
                        "There is a connection, but our state indicates that we should not be connected",
                    ))
                }
            }
            None => Err(Error::new(
                ErrorKind::NotConnected,
                "Not connected to any server",
            )),
        }
    }

    /// Check if the client is in the correct state.
    fn check_client_state(&self, state: ClientState) -> Result<()> {
        if self.state != state {
            Err(Error::new(
                ErrorKind::IncorrectStateForCommand,
                "The connection is not the right state to use this command",
            ))
        } else {
            Ok(())
        }
    }

    /// ## Current client state
    ///
    /// Indicates what state the client is currently in, can be either
    /// Authentication, Transaction, Update or None.
    ///
    /// Some methods are only available in some specified states and will error if run in an incorrect state.
    ///
    /// https://www.rfc-editor.org/rfc/rfc1939#section-3
    pub fn get_state(&self) -> &ClientState {
        &self.state
    }

    /// ## NOOP
    /// The POP3 server does nothing, it merely replies with a positive response.
    /// ### Arguments: none
    /// ### Restrictions:
    /// - May only be given in the TRANSACTION state
    /// ### Possible Responses:
    /// - OK
    /// # Examples:
    /// ```rust,ignore
    /// client.noop()?;
    /// ```
    /// https://www.rfc-editor.org/rfc/rfc1939#page-9
    pub async fn noop(&mut self) -> Result<()> {
        let socket = self.get_socket_mut()?;

        let command = "NOOP";

        socket.send_command(command, false).await?;

        Ok(())
    }

    pub async fn uidl(&mut self, msg_number: Option<u32>) -> Result<UniqueIDResponse> {
        self.check_capability(vec![Capability::Uidl])?;

        match msg_number.as_ref() {
            Some(msg_number) => self.check_deleted(msg_number)?,
            None => {}
        };

        let response_is_multi_line = msg_number.is_none();

        let socket = self.get_socket_mut()?;

        let arguments = if msg_number.is_some() {
            vec![msg_number.unwrap().to_string()]
        } else {
            Vec::new()
        };

        let command = create_command("UIDL", &arguments)?;

        let response = socket.send_command(command, response_is_multi_line).await?;

        let parser = Parser::new(response);

        if response_is_multi_line {
            Ok(UniqueIDResponse::UniqueIDList(parser.to_unique_id_list()))
        } else {
            Ok(UniqueIDResponse::UniqueID(parser.to_unique_id()))
        }
    }

    pub async fn top(&mut self, msg_number: u32, lines: u32) -> Result<Vec<u8>> {
        self.check_deleted(&msg_number)?;

        self.check_capability(vec![Capability::Top])?;

        let socket = self.get_socket_mut()?;

        let command = format!("TOP {} {}", msg_number, lines);

        socket.send_command(command, false).await?;

        let mut response: Vec<u8> = Vec::new();

        socket.read_multi_line(&mut response).await?;

        Ok(response)
    }

    /// Check whether a given message is marked as deleted by the server.
    ///
    /// If this function returns true then the message may still not exist.
    /// # Examples:
    /// ```rust,ignore
    /// let msg_number: u32 = 8;
    /// let is_deleted = client.is_deleted(msg_number);
    /// assert_eq!(is_deleted, false);
    /// ```
    pub fn is_deleted(&mut self, msg_number: &u32) -> bool {
        self.marked_as_del.sort();

        match self.marked_as_del.binary_search(msg_number) {
            Ok(_) => true,
            Err(_) => false,
        }
    }

    fn check_deleted(&mut self, msg_number: &u32) -> Result<()> {
        if self.is_deleted(msg_number) {
            Err(types::Error::new(
                types::ErrorKind::MessageIsDeleted,
                "This message has been marked as deleted and cannot be refenced anymore",
            ))
        } else {
            Ok(())
        }
    }

    /// ## DELE
    /// The POP3 server marks the message as deleted.  Any future reference to the message-number associated with the message in a POP3 command generates an error.  The POP3 server does not actually delete the message until the POP3 session enters the UPDATE state.
    /// ### Arguments:
    /// - a message-number (required) which may NOT refer to a message marked as deleted.
    /// ### Restrictions:
    /// - may only be given in the TRANSACTION state
    /// ### Possible Responses:
    /// - OK: message deleted
    /// - ERR: no such message
    /// # Examples
    /// ```rust,ignore
    /// let msg_number: u32 = 8;
    /// let is_deleted = client.is_deleted(msg_number);
    ///
    /// println!("{}", is_deleted);
    /// ```
    pub async fn dele(&mut self, msg_number: u32) -> Result<()> {
        self.check_deleted(&msg_number)?;

        let socket = self.get_socket_mut()?;

        let command = format!("DELE {}", msg_number);

        socket.send_command(command.as_bytes(), false).await?;

        Ok(())
    }

    /// ## RSET
    /// If any messages have been marked as deleted by the POP3
    /// server, they are unmarked.
    /// ### Arguments: none
    /// ### Restrictions:
    /// - May only be given in the TRANSACTION state
    /// ### Possible Responses:
    /// - +OK
    /// # Examples:
    /// ```rust,ignore
    /// client.rset().unwrap();
    /// ```
    /// https://www.rfc-editor.org/rfc/rfc1939#page-9
    pub async fn rset(&mut self) -> Result<()> {
        let socket = self.get_socket_mut()?;

        let command = b"RSET";

        socket.send_command(command, false).await?;

        Ok(())
    }

    /// ## RETR
    /// Retrieves the full RFC822 compliant message from the server and returns it as a byte vector
    /// ### Arguments:
    /// - A message-number (required) which may NOT refer to a message marked as deleted
    /// ### Restrictions:
    /// - May only be given in the TRANSACTION state
    /// ### Possible Responses:
    /// - OK: message follows
    /// - ERR: no such message
    /// # Examples
    /// ```rust,ignore
    /// extern crate mailparse;
    /// use mailparse::parse_mail;
    ///
    /// let response = client.retr(1).unwrap();
    ///
    /// let parsed = parse_mail(&response);
    ///
    /// let subject = parsed.headers.get_first_value("Subject").unwrap();
    ///
    /// println!("{}", subject);
    /// ```
    /// https://www.rfc-editor.org/rfc/rfc1939#page-8
    pub async fn retr(&mut self, msg_number: u32) -> Result<Vec<u8>> {
        self.check_deleted(&msg_number)?;

        let socket = self.get_socket_mut()?;

        let arguments = vec![msg_number.to_string()];

        let command = create_command("RETR", &arguments)?;

        socket.send_bytes(command.as_bytes()).await?;

        let mut response: Vec<u8> = Vec::new();

        socket.read_multi_line(&mut response).await?;

        Ok(response)
    }

    pub async fn list(&mut self, msg_number: Option<u32>) -> Result<StatsResponse> {
        match msg_number.as_ref() {
            Some(msg_number) => {
                self.check_deleted(msg_number)?;
            }
            None => {}
        };

        let socket = self.get_socket_mut()?;

        let response_is_multi_line = msg_number.is_none();

        let arguments = if !response_is_multi_line {
            vec![msg_number.unwrap().to_string()]
        } else {
            Vec::new()
        };

        let command = create_command("LIST", &arguments)?;

        let response = socket.send_command(command, response_is_multi_line).await?;

        let parser = Parser::new(response);

        if response_is_multi_line {
            // println!("{}", response);

            Ok(StatsResponse::StatsList(parser.to_stats_list()))
        } else {
            Ok(StatsResponse::Stats(parser.to_stats()))
        }
    }

    pub async fn stat(&mut self) -> Result<Stats> {
        let socket = self.get_socket_mut()?;

        let command = b"STAT";

        let response = socket.send_command(command, false).await?;

        let parser = Parser::new(response);

        let stats = parser.to_stats();

        Ok(stats)
    }

    pub async fn apop(&mut self, name: &str, digest: &str) -> Result<()> {
        self.check_client_state(ClientState::Authentication)?;

        self.has_read_greeting()?;

        let socket = self.get_socket_mut()?;

        let command = format!("APOP {} {}", name, digest);

        socket.send_command(command, false).await?;

        self.state = ClientState::Transaction;

        Ok(())
    }

    pub async fn auth<U: AsRef<str>>(&mut self, token: U) -> Result<()> {
        self.check_client_state(ClientState::Authentication)?;

        self.check_capability(vec![Capability::Sasl(vec![String::from("XOAUTH2")])])?;

        self.has_read_greeting()?;

        let socket = self.get_socket_mut()?;

        let command = format!("AUTH {}", token.as_ref());

        socket.send_command(command, false).await?;

        self.state = ClientState::Transaction;

        Ok(())
    }

    pub async fn login<U: AsRef<str>, P: AsRef<str>>(
        &mut self,
        user: U,
        password: P,
    ) -> Result<()> {
        self.check_client_state(ClientState::Authentication)?;

        self.check_capability(vec![
            Capability::User,
            Capability::Sasl(vec![String::from("PLAIN")]),
        ])?;

        self.has_read_greeting()?;

        let socket = self.get_socket_mut()?;

        let command = format!("USER {}", user.as_ref());

        socket.send_command(command, false).await?;

        let command = format!("PASS {}", password.as_ref());

        socket.send_command(command, false).await?;

        self.capabilities = self.capa().await?;

        self.state = ClientState::Transaction;

        Ok(())
    }

    pub async fn quit(&mut self) -> Result<()> {
        let socket = self.get_socket_mut()?;

        let command = b"QUIT";

        socket.send_command(command, false).await?;

        self.state = ClientState::Update;
        self.socket = None;
        self.state = ClientState::None;

        self.marked_as_del.clear();
        self.capabilities.clear();

        Ok(())
    }

    /// Check whether the server supports one of the given capabilities.
    pub fn has_capability(&mut self, capabilities: Vec<Capability>) -> bool {
        self.capabilities.sort();

        match capabilities.iter().find(|capability| {
            match self.capabilities.binary_search(&capability) {
                Ok(_) => true,
                Err(_) => false,
            }
        }) {
            Some(_) => true,
            None => false,
        }
    }

    /// Make sure the given capabilities are present
    fn check_capability(&mut self, capability: Vec<Capability>) -> Result<()> {
        if !self.has_capability(capability) {
            Err(types::Error::new(
                types::ErrorKind::FeatureUnsupported,
                "The remote pop server does not support this command/function",
            ))
        } else {
            Ok(())
        }
    }

    /// Returns the current list of capabilities given by the server.
    pub fn capabilities(&self) -> &Capabilities {
        &self.capabilities
    }

    /// Fetches a list of capabilities for the currently connected server and returns it.
    pub async fn capa(&mut self) -> Result<Capabilities> {
        let socket = self.get_socket_mut()?;

        let command = b"CAPA";

        let response = socket.send_command(command, true).await?;

        Ok(parse_capabilities(&response))
    }

    fn has_read_greeting(&self) -> Result<()> {
        if !self.read_greeting {
            Err(types::Error::new(
                types::ErrorKind::ServerFailedToGreet,
                "Did not connect to the server correctly, as we did not get a greeting yet",
            ))
        } else {
            Ok(())
        }
    }

    async fn read_greeting(&mut self) -> Result<String> {
        assert!(!self.read_greeting, "Cannot read greeting twice");

        let socket = self.get_socket_mut()?;

        let response = socket.read_response(false).await?;

        self.read_greeting = true;
        Ok(response)
    }

    pub fn greeting(&self) -> Option<&str> {
        match &self.greeting {
            Some(greeting) => Some(greeting.as_str()),
            None => None,
        }
    }
}

#[cfg(test)]
mod test;

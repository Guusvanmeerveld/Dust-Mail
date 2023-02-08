mod constants;
mod parse;
mod socket;
pub mod types;
mod utils;

use std::{
    io::{Read, Write},
    net::{TcpStream, ToSocketAddrs},
    time::Duration,
};

use either::Either::{self, Left, Right};
use native_tls::{TlsConnector, TlsStream};
use parse::{map_native_tls_error, parse_capabilities, parse_socket_address, Parser};
use socket::Socket;
use types::{Capabilities, Capability, Stats, UniqueID};
use utils::create_command;

#[derive(Eq, PartialEq, Debug)]
pub enum ClientState {
    Authentication,
    Transaction,
    Update,
    None,
}

pub struct Client<S: Read + Write> {
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

fn create_client_from_socket<S: Read + Write>(socket: Socket<S>) -> types::Result<Client<S>> {
    let mut client = Client {
        marked_as_del: Vec::new(),
        capabilities: Vec::new(),
        greeting: None,
        read_greeting: false,
        socket: Some(socket),
        state: ClientState::Authentication,
    };

    client.greeting = Some(client.read_greeting()?);

    client.capabilities = client.capa()?;

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
pub fn new<S: Read + Write>(stream: S) -> types::Result<Client<S>> {
    let socket = Socket::new(stream);

    create_client_from_socket(socket)
}

/// Create a new pop3 client with a tls connection.
pub fn connect<A: ToSocketAddrs>(
    addr: A,
    domain: &str,
    tls_connector: &TlsConnector,
    connection_timeout: Option<Duration>,
) -> types::Result<Client<TlsStream<TcpStream>>> {
    let connection_timeout = get_connection_timeout(connection_timeout);

    let addr = parse_socket_address(addr)?;

    let tcp_stream = TcpStream::connect_timeout(&addr, connection_timeout).map_err(|e| {
        types::Error::new(
            types::ErrorKind::Connect,
            format!("Failed to connect to server: {}", e.to_string()),
        )
    })?;

    let tls_stream = tls_connector
        .connect(domain, tcp_stream)
        .map_err(map_native_tls_error)?;

    let socket = Socket::new(tls_stream);

    create_client_from_socket(socket)
}

/// Creates a new pop3 client using a plain connection.
///
/// DO NOT USE in a production environment. Your password will be sent over a plain tcp stream which hackers could intercept.
pub fn connect_plain<A: ToSocketAddrs>(
    addr: A,
    connection_timeout: Option<Duration>,
) -> types::Result<Client<TcpStream>> {
    let connection_timeout = get_connection_timeout(connection_timeout);

    let addr = parse_socket_address(addr)?;

    let tcp_stream = TcpStream::connect_timeout(&addr, connection_timeout).map_err(|e| {
        types::Error::new(
            types::ErrorKind::Connect,
            format!("Failed to connect to server: {}", e.to_string()),
        )
    })?;

    let socket = Socket::new(tcp_stream);

    create_client_from_socket(socket)
}

impl<S: Read + Write> Client<S> {
    fn get_socket_mut(&mut self) -> types::Result<&mut Socket<S>> {
        match self.socket.as_mut() {
            Some(socket) => {
                if self.state == ClientState::Transaction
                    || self.state == ClientState::Authentication
                {
                    Ok(socket)
                } else {
                    Err(types::Error::new(
                        types::ErrorKind::ShouldNotBeConnected,
                        "There is a connection, but our state indicates that we should not be connected",
                    ))
                }
            }
            None => Err(types::Error::new(
                types::ErrorKind::NotConnected,
                "Not connected to any server",
            )),
        }
    }

    fn is_correct_state(&self, state: ClientState) -> types::Result<()> {
        if self.state != state {
            Err(types::Error::new(
                types::ErrorKind::IncorrectStateForCommand,
                "The connection is not the right state to use this command",
            ))
        } else {
            Ok(())
        }
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
    pub fn noop(&mut self) -> types::Result<()> {
        let socket = self.get_socket_mut()?;

        let command = b"NOOP";

        socket.send_command(command)?;

        Ok(())
    }

    pub fn uidl(
        &mut self,
        msg_number: Option<u32>,
    ) -> types::Result<Either<Vec<UniqueID>, UniqueID>> {
        self.has_capability_else_err(vec![Capability::Uidl])?;

        if msg_number.is_some() {
            self.is_deleted_else_err(msg_number.as_ref().unwrap())?;
        }

        let socket = self.get_socket_mut()?;

        let is_single = msg_number.is_some();

        let arguments = Some(vec![msg_number]);

        let command = create_command("UIDL", &arguments)?;

        let response = socket.send_command(command.as_bytes())?;

        if is_single {
            let parser = Parser::new(response);

            Ok(Right(parser.to_unique_id()))
        } else {
            let mut response: Vec<u8> = Vec::new();

            socket.read_multi_line(&mut response)?;

            let response = String::from_utf8(response).unwrap();
            let parser = Parser::new(response);

            Ok(Left(parser.to_unique_id_list()))
        }
    }

    pub fn top(&mut self, msg_number: u32, lines: u32) -> types::Result<Vec<u8>> {
        self.is_deleted_else_err(&msg_number)?;

        self.has_capability_else_err(vec![Capability::Top])?;

        let socket = self.get_socket_mut()?;

        let command = format!("TOP {} {}", msg_number, lines);

        socket.send_command(command.as_bytes())?;

        let mut response: Vec<u8> = Vec::new();

        socket.read_multi_line(&mut response)?;

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

    fn is_deleted_else_err(&mut self, msg_number: &u32) -> types::Result<()> {
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
    pub fn dele(&mut self, msg_number: u32) -> types::Result<()> {
        self.is_deleted_else_err(&msg_number)?;

        let socket = self.get_socket_mut()?;

        let command = format!("DELE {}", msg_number);

        socket.send_command(command.as_bytes())?;

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
    pub fn rset(&mut self) -> types::Result<()> {
        let socket = self.get_socket_mut()?;

        let command = b"RSET";

        socket.send_command(command)?;

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
    pub fn retr(&mut self, msg_number: u32) -> types::Result<Vec<u8>> {
        self.is_deleted_else_err(&msg_number)?;

        let socket = self.get_socket_mut()?;

        let arguments = Some(vec![Some(msg_number)]);

        let command = create_command("RETR", &arguments)?;

        socket.send_command(command.as_bytes())?;

        let mut response: Vec<u8> = Vec::new();

        socket.read_multi_line(&mut response)?;

        Ok(response)
    }

    pub fn list(&mut self, msg_number: Option<u32>) -> types::Result<Either<Vec<Stats>, Stats>> {
        if msg_number.is_some() {
            self.is_deleted_else_err(msg_number.as_ref().unwrap())?;
        }

        let socket = self.get_socket_mut()?;

        let is_single = msg_number.is_some();

        let arguments = Some(vec![msg_number]);

        let command = create_command("LIST", &arguments)?;

        let response = socket.send_command(command.as_bytes())?;

        if is_single {
            let parser = Parser::new(response);

            Ok(Right(parser.to_stats()))
        } else {
            let mut response: Vec<u8> = Vec::new();

            socket.read_multi_line(&mut response)?;

            let response = String::from_utf8(response).unwrap();

            let parser = Parser::new(response);

            Ok(Left(parser.to_stats_list()))
        }
    }

    pub fn stat(&mut self) -> types::Result<Stats> {
        let socket = self.get_socket_mut()?;

        let command = b"STAT";

        let response = socket.send_command(command)?;

        let parser = Parser::new(response);

        let stats = parser.to_stats();

        Ok(stats)
    }

    pub fn apop(&mut self, name: &str, digest: &str) -> types::Result<()> {
        self.is_correct_state(ClientState::Authentication)?;

        self.has_read_greeting()?;

        let socket = self.get_socket_mut()?;

        let command = format!("APOP {} {}", name, digest);

        socket.send_command(command.as_bytes())?;

        self.state = ClientState::Transaction;
        Ok(())
    }

    pub fn login(&mut self, user: &str, password: &str) -> types::Result<()> {
        self.is_correct_state(ClientState::Authentication)?;

        self.has_capability_else_err(vec![
            Capability::User,
            Capability::Sasl(vec![String::from("PLAIN")]),
        ])?;

        self.has_read_greeting()?;

        let socket = self.get_socket_mut()?;

        let command = format!("USER {}", user);

        socket.send_command(command.as_bytes())?;

        let command = format!("PASS {}", password);

        socket.send_command(command.as_bytes())?;

        self.capabilities = self.capa()?;

        self.state = ClientState::Transaction;

        Ok(())
    }

    pub fn quit(&mut self) -> types::Result<()> {
        let socket = self.get_socket_mut()?;

        let command = b"QUIT";

        socket.send_command(command)?;

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

    fn has_capability_else_err(&mut self, capability: Vec<Capability>) -> types::Result<()> {
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
    pub fn capa(&mut self) -> types::Result<Capabilities> {
        let socket = self.get_socket_mut()?;

        let command = b"CAPA";

        socket.send_command(command)?;

        let mut response: Vec<u8> = Vec::new();

        socket.read_multi_line(&mut response)?;

        let response = String::from_utf8(response).unwrap();

        Ok(parse_capabilities(&response))
    }

    fn has_read_greeting(&self) -> types::Result<()> {
        if !self.read_greeting {
            Err(types::Error::new(
                types::ErrorKind::ServerFailedToGreet,
                "Did not connect to the server correctly, as we did not get a greeting yet",
            ))
        } else {
            Ok(())
        }
    }

    fn read_greeting(&mut self) -> types::Result<String> {
        assert!(!self.read_greeting, "Cannot read greeting twice");

        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let response = socket.read_response();

        match response {
            Ok(greeting) => {
                self.read_greeting = true;
                Ok(greeting)
            }
            Err(err) => Err(err),
        }
    }

    pub fn greeting(&self) -> Option<&str> {
        match &self.greeting {
            Some(greeting) => Some(greeting.as_str()),
            None => None,
        }
    }
}

#[cfg(test)]
mod test {
    use std::{env, net::TcpStream};

    use dotenv::dotenv;
    use either::Either::{Left, Right};

    use crate::ClientState;

    use super::Client;

    #[derive(Debug)]
    struct ClientInfo {
        server: String,
        port: u16,
        username: String,
        password: String,
    }

    fn create_client_info() -> ClientInfo {
        dotenv().ok();

        ClientInfo {
            server: env::var("SERVER").unwrap().to_owned(),
            port: env::var("PORT").unwrap().parse().unwrap(),
            username: env::var("USERNAME").unwrap().to_owned(),
            password: env::var("PASSWORD").unwrap().to_owned(),
        }
    }

    fn create_logged_in_client() -> Client<TcpStream> {
        let client_info = create_client_info();
        let server = client_info.server.as_ref();
        let port = client_info.port;

        let username = client_info.username.as_ref();
        let password = client_info.password.as_ref();

        let mut client = super::connect_plain((server, port), None).unwrap();

        client.login(username, password).unwrap();

        client
    }

    #[test]
    fn connect() {
        let client_info = create_client_info();

        let server = client_info.server.as_ref();
        let port = client_info.port;

        let mut client = super::connect_plain((server, port), None).unwrap();

        let greeting = client.greeting().unwrap();

        assert_eq!(greeting, "POP3 GreenMail Server v1.6.12 ready");

        client.quit().unwrap()
    }

    #[test]
    fn login() {
        let mut client = create_logged_in_client();

        assert_eq!(client.state, ClientState::Transaction);

        client.quit().unwrap();
    }

    #[test]
    fn noop() {
        let mut client = create_logged_in_client();

        assert_eq!(client.noop().unwrap(), ());

        client.quit().unwrap();
    }

    #[test]
    fn stat() {
        let mut client = create_logged_in_client();

        let stats = client.stat().unwrap();

        assert_eq!(stats, (0, 0));

        client.quit().unwrap();
    }

    #[test]
    fn list() {
        let mut client = create_logged_in_client();

        // let list = client.list(Some(4)).unwrap();

        // match list {
        //     Right(list_item) => {
        //         println!("{}", list_item.0);
        //     }
        //     _ => {}
        // };

        let list = client.list(None).unwrap();

        match list {
            Left(list) => {
                assert_eq!(list, Vec::new());
            }
            _ => {}
        };

        client.quit().unwrap();
    }

    // #[test]
    // fn retr() {
    //     let mut client = create_logged_in_client();

    //     let bytes = client.retr(1).unwrap();

    //     println!("{}", String::from_utf8(bytes).unwrap());

    //     client.quit().unwrap();
    // }

    // #[test]
    // fn top() {
    //     let mut client = create_logged_in_client();

    //     let bytes = client.top(1, 0).unwrap();

    //     println!("{}", String::from_utf8(bytes).unwrap());

    //     client.quit().unwrap();
    // }

    // #[test]
    // fn uidl() {
    //     let mut client = create_logged_in_client();

    //     let uidl = client.uidl(Some(1)).unwrap();

    //     match uidl {
    //         Right(unique_id) => {
    //             println!("{}", unique_id.1);
    //         }
    //         _ => {}
    //     };

    //     let uidl = client.uidl(None).unwrap();

    //     match uidl {
    //         Left(list) => {
    //             println!("{}", list.len());
    //         }
    //         _ => {}
    //     };

    //     client.quit().unwrap();
    // }
}

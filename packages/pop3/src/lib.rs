mod constants;
mod parse;
mod socket;
pub mod types;
mod utils;

use std::net::{TcpStream, ToSocketAddrs};

use either::Either::{self, Left, Right};
use native_tls::{TlsConnector, TlsStream};
use parse::{map_native_tls_error, Parser};
use socket::Socket;
use types::{Stats, UniqueID};
use utils::create_command;

#[derive(Eq, PartialEq)]
pub enum ClientState {
    Authentication,
    Transaction,
    Update,
    None,
}

pub struct Client {
    socket: Option<Socket<TlsStream<TcpStream>>>,
    read_greeting: bool,
    marked_as_del: Vec<u32>,
    pub state: ClientState,
}

impl Client {
    pub fn new() -> Client {
        Self {
            socket: None,
            read_greeting: false,
            state: ClientState::None,
            marked_as_del: Vec::new(),
        }
    }

    fn get_socket_mut(&mut self) -> types::Result<&mut Socket<TlsStream<TcpStream>>> {
        match self.socket.as_mut() {
            Some(socket) => {
                if self.state == ClientState::Transaction
                    || self.state == ClientState::Authentication
                {
                    Ok(socket)
                } else {
                    Err(types::Error::new(
                        types::ErrorKind::Connection,
                        "There is a connection, but our state indicates that we should not be connected",
                    ))
                }
            }
            None => Err(types::Error::new(
                types::ErrorKind::Connection,
                "Not connected to any server",
            )),
        }
    }

    fn is_correct_state(&self, state: ClientState) -> types::Result<()> {
        if self.state != state {
            Err(types::Error::new(
                types::ErrorKind::State,
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
    /// ```rust,no_run
    /// client.noop().unwrap();
    /// ```
    /// https://www.rfc-editor.org/rfc/rfc1939#page-9
    pub fn noop(&mut self) -> types::Result<()> {
        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let noop_command = b"NOOP";

        match socket.send_command(noop_command) {
            Ok(_) => Ok(()),
            Err(err) => Err(err),
        }
    }

    pub fn uidl(
        &mut self,
        msg_number: Option<u32>,
    ) -> types::Result<Either<Vec<UniqueID>, UniqueID>> {
        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let is_single = msg_number.is_some();

        let arguments = Some(vec![msg_number]);

        let command = match create_command("UIDL", arguments) {
            Ok(command) => command,
            Err(err) => return Err(err),
        };

        match socket.send_command(command.as_bytes()) {
            Ok(response) => {
                if is_single {
                    let parser = Parser::new(response);

                    Ok(Right(parser.to_unique_id()))
                } else {
                    let mut response: Vec<u8> = Vec::new();

                    match socket.read_multi_line(&mut response) {
                        Ok(_) => {
                            let response = String::from_utf8(response).unwrap();
                            let parser = Parser::new(response);

                            Ok(Left(parser.to_unique_id_list()))
                        }
                        Err(err) => Err(err),
                    }
                }
            }
            Err(err) => Err(err),
        }
    }

    pub fn top(&mut self, msg_number: u32, lines: u32) -> types::Result<Vec<u8>> {
        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let command = format!("TOP {} {}", msg_number, lines);

        match socket.send_command(command.as_bytes()) {
            Ok(_) => {
                let mut response: Vec<u8> = Vec::new();

                match socket.read_multi_line(&mut response) {
                    Ok(_) => Ok(response),
                    Err(err) => Err(err),
                }
            }
            Err(err) => Err(err),
        }
    }

    /// Check whether a given message is marked as deleted by the server.
    ///
    /// If this function returns true then the message may still not exist.
    /// # Examples:
    /// ```rust,no_run
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
    /// ```rust,no_run
    /// let msg_number: u32 = 8;
    /// let is_deleted = client.is_deleted(msg_number);
    ///
    /// println!("{}", is_deleted);
    /// ```
    pub fn dele(&mut self, msg_number: u32) -> types::Result<()> {
        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let command = format!("DELE {}", msg_number);

        match socket.send_command(command.as_bytes()) {
            Ok(_) => Ok(()),
            Err(err) => Err(err),
        }
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
    /// ```rust,no_run
    /// client.rset().unwrap();
    /// ```
    /// https://www.rfc-editor.org/rfc/rfc1939#page-9
    pub fn rset(&mut self) -> types::Result<()> {
        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let command = b"RSET";

        match socket.send_command(command) {
            Ok(_) => Ok(()),
            Err(err) => Err(err),
        }
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
    /// ```rust,no_run
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
        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let arguments = Some(vec![Some(msg_number)]);

        let command = match create_command("RETR", arguments) {
            Ok(command) => command,
            Err(err) => return Err(err),
        };

        match socket.send_command(command.as_bytes()) {
            Ok(_) => {
                let mut response: Vec<u8> = Vec::new();

                match socket.read_multi_line(&mut response) {
                    Ok(_) => Ok(response),
                    Err(err) => Err(err),
                }
            }
            Err(err) => Err(err),
        }
    }

    pub fn list(&mut self, msg_number: Option<u32>) -> types::Result<Either<Vec<Stats>, Stats>> {
        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let is_single = msg_number.is_some();

        let arguments = Some(vec![msg_number]);

        let command = match create_command("LIST", arguments) {
            Ok(command) => command,
            Err(err) => return Err(err),
        };

        match socket.send_command(command.as_bytes()) {
            Ok(response) => {
                if is_single {
                    let parser = Parser::new(response);

                    Ok(Right(parser.to_stats()))
                } else {
                    let mut response: Vec<u8> = Vec::new();

                    match socket.read_multi_line(&mut response) {
                        Ok(_) => {
                            let response = String::from_utf8(response).unwrap();

                            let parser = Parser::new(response);

                            Ok(Left(parser.to_stats_list()))
                        }
                        Err(err) => Err(err),
                    }
                }
            }
            Err(err) => Err(err),
        }
    }

    pub fn stat(&mut self) -> types::Result<Stats> {
        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let command = b"STAT";

        match socket.send_command(command) {
            Ok(response) => {
                let parser = Parser::new(response);

                let stats = parser.to_stats();

                Ok(stats)
            }
            Err(err) => Err(err),
        }
    }

    pub fn apop(&mut self, name: &str, digest: &str) -> types::Result<()> {
        let is_correct_state = self.is_correct_state(ClientState::Authentication);

        if is_correct_state.is_err() {
            return is_correct_state;
        };

        let has_read_greeting = self.has_read_greeting();

        if has_read_greeting.is_err() {
            return has_read_greeting;
        };

        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let command = format!("APOP {} {}", name, digest);

        match socket.send_command(command.as_bytes()) {
            Ok(_) => {
                self.state = ClientState::Transaction;
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    pub fn login(&mut self, user: &str, password: &str) -> types::Result<()> {
        let is_correct_state = self.is_correct_state(ClientState::Authentication);

        if is_correct_state.is_err() {
            return is_correct_state;
        };

        let has_read_greeting = self.has_read_greeting();

        if has_read_greeting.is_err() {
            return has_read_greeting;
        };

        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let command = format!("USER {}", user);

        match socket.send_command(command.as_bytes()) {
            Ok(_) => {
                let command = format!("PASS {}", password);

                match socket.send_command(command.as_bytes()) {
                    Ok(_) => {
                        self.state = ClientState::Transaction;

                        Ok(())
                    }
                    Err(err) => Err(err),
                }
            }
            Err(err) => Err(err),
        }
    }

    pub fn quit(&mut self) -> types::Result<()> {
        let is_correct_state = self.is_correct_state(ClientState::Transaction);

        if is_correct_state.is_err() {
            return is_correct_state;
        };

        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let command = b"QUIT";

        match socket.send_command(command) {
            Ok(_) => {
                self.state = ClientState::Update;
                self.socket = None;
                self.state = ClientState::None;

                self.marked_as_del.clear();

                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    fn has_read_greeting(&self) -> types::Result<()> {
        if !self.read_greeting {
            Err(types::Error::new(
                types::ErrorKind::Read,
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

    pub fn connect<A: ToSocketAddrs>(
        &mut self,
        addr: A,
        domain: &str,
        tls_connector: &TlsConnector,
    ) -> types::Result<String> {
        let is_correct_state = self.is_correct_state(ClientState::None);

        match is_correct_state {
            Ok(_) => {}
            Err(err) => return Err(err),
        };

        match TcpStream::connect(addr).map_err(|e| {
            types::Error::new(
                types::ErrorKind::Connection,
                format!("Failed to connect to server: {}", e.to_string()),
            )
        }) {
            Ok(tcp_stream) => match tls_connector
                .connect(domain, tcp_stream)
                .map_err(map_native_tls_error)
            {
                Ok(tls_stream) => {
                    let socket = Socket::new(tls_stream);

                    self.socket = Some(socket);

                    self.state = ClientState::Authentication;

                    self.read_greeting()
                }
                Err(err) => Err(err),
            },
            Err(err) => Err(err),
        }
    }
}

#[cfg(test)]
mod test {
    use std::{collections::HashMap, env};

    use dotenv::dotenv;
    use either::Either::{Left, Right};

    use super::{Client, TlsConnector};

    struct ClientInfo {
        server: String,
        port: u16,
        username: String,
        password: String,
    }

    fn get_env() -> HashMap<String, String> {
        dotenv().ok();

        let mut map = HashMap::new();

        let vars = env::vars();

        for var in vars {
            match map.insert(var.0, var.1) {
                _ => {}
            };
        }

        map
    }

    fn create_client_info() -> ClientInfo {
        let envs = get_env();

        ClientInfo {
            server: String::from("pop.gmail.com"),
            port: 995,
            username: envs.get("USERNAME").unwrap().to_owned(),
            password: envs.get("PASSWORD").unwrap().to_owned(),
        }
    }

    fn create_logged_in_client() -> Client {
        let mut client = Client::new();

        let client_info = create_client_info();

        let server = client_info.server.as_ref();
        let port = client_info.port;

        let username = client_info.username.as_ref();
        let password = client_info.password.as_ref();

        let tls = TlsConnector::new().unwrap();

        client.connect((server, port), server, &tls).unwrap();

        client.login(username, password).unwrap();

        client
    }

    #[test]
    fn connect() {
        let mut client = Client::new();

        let client_info = create_client_info();

        let server = client_info.server.as_ref();
        let port = client_info.port;

        let tls_connector = TlsConnector::new().unwrap();

        let greeting = client
            .connect((server, port), server, &tls_connector)
            .unwrap();

        println!("{}", greeting);
    }

    #[test]
    fn login() {
        let mut client = Client::new();

        let client_info = create_client_info();

        let server = client_info.server.as_ref();
        let port = client_info.port;

        let username = client_info.username.as_ref();
        let password = client_info.password.as_ref();

        let tls_connector = TlsConnector::new().unwrap();

        client
            .connect((server, port), server, &tls_connector)
            .unwrap();

        client.login(username, password).unwrap();
    }

    #[test]
    fn logout() {
        let mut client = create_logged_in_client();

        client.quit().unwrap();
    }

    #[test]
    fn noop() {
        let mut client = create_logged_in_client();

        client.noop().unwrap();

        client.quit().unwrap();
    }

    #[test]
    fn stat() {
        let mut client = create_logged_in_client();

        let stats = client.stat().unwrap();

        println!("{}", stats.0);

        client.quit().unwrap();
    }

    #[test]
    fn list() {
        let mut client = create_logged_in_client();

        let list = client.list(Some(4)).unwrap();

        match list {
            Right(list_item) => {
                println!("{}", list_item.0);
            }
            _ => {}
        };

        let list = client.list(None).unwrap();

        match list {
            Left(list) => {
                println!("{}", list.len());
            }
            _ => {}
        };

        client.quit().unwrap();
    }

    #[test]
    fn retr() {
        let mut client = create_logged_in_client();

        let bytes = client.retr(1).unwrap();

        println!("{}", String::from_utf8(bytes).unwrap());

        client.quit().unwrap();
    }

    #[test]
    fn top() {
        let mut client = create_logged_in_client();

        let bytes = client.top(1, 0).unwrap();

        println!("{}", String::from_utf8(bytes).unwrap());

        client.quit().unwrap();
    }

    #[test]
    fn uidl() {
        let mut client = create_logged_in_client();

        let uidl = client.uidl(Some(1)).unwrap();

        match uidl {
            Right(unique_id) => {
                println!("{}", unique_id.1);
            }
            _ => {}
        };

        let uidl = client.uidl(None).unwrap();

        match uidl {
            Left(list) => {
                println!("{}", list.len());
            }
            _ => {}
        };

        client.quit().unwrap();
    }
}

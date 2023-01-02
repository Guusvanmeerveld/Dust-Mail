mod parse;
mod socket;
mod types;

use std::{io, net::TcpStream};

use either::Either::{self, Left, Right};
use native_tls::{TlsConnector, TlsStream};
use parse::Parser;
use socket::Socket;
use types::{ListItem, Stats};

fn format_server_string(server: &str, port: u16) -> String {
    format!("{}:{}", server, port)
}

fn map_native_tls_error(error: native_tls::HandshakeError<TcpStream>) -> io::Error {
    io::Error::new(io::ErrorKind::Other, error.to_string())
}

fn map_string_to_error(error: String) -> io::Error {
    io::Error::new(io::ErrorKind::Other, error)
}

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
    pub state: ClientState,
}

impl Client {
    pub fn new() -> Client {
        Self {
            socket: None,
            read_greeting: false,
            state: ClientState::None,
        }
    }

    fn get_socket_mut(&mut self) -> io::Result<&mut Socket<TlsStream<TcpStream>>> {
        match self.socket.as_mut() {
            Some(socket) => {
                if self.state == ClientState::Transaction
                    || self.state == ClientState::Authentication
                {
                    Ok(socket)
                } else {
                    Err(io::Error::new(
                        io::ErrorKind::Other,
                        "There is a connection, but our state indicates that we should not be connected",
                    ))
                }
            }
            None => Err(io::Error::new(
                io::ErrorKind::NotConnected,
                "Not connected to any server",
            )),
        }
    }

    fn read_greeting(&mut self) -> io::Result<()> {
        assert!(!self.read_greeting, "Cannot read greeting twice");

        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let response = socket.read_response();

        match response {
            Ok(greeting) => match greeting {
                Ok(_) => {
                    self.read_greeting = true;
                    Ok(())
                }
                Err(response) => {
                    return Err(io::Error::new(
                        io::ErrorKind::ConnectionRefused,
                        format!("Server did not greet us correctly: {}", response),
                    ));
                }
            },
            Err(err) => Err(err),
        }
    }

    pub fn noop(&mut self) -> io::Result<()> {
        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let noop_command = b"NOOP";

        match socket.send_command(noop_command) {
            Ok(response) => match response.map_err(map_string_to_error) {
                Ok(_) => Ok(()),
                Err(err) => Err(err),
            },
            Err(err) => Err(err),
        }
    }

    // pub fn top(&mut self, msg_number: u32, lines: u32) -> io::Result<()> {}

    pub fn retr(&mut self, msg_number: u32) -> io::Result<()> {
        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let retr_command = format!("RETR {}", msg_number);

        match socket.send_bytes(retr_command.as_bytes()) {
            Ok(_) => {
                match socket.read_response() {
                    Ok(status_message) => match status_message.map_err(map_string_to_error) {
                        Ok(status_message) => status_message,
                        Err(err) => return Err(err),
                    },
                    Err(err) => return Err(err),
                };

                // println!("{}", status_message);

                let mut response: Vec<u8> = Vec::new();

                match socket.read_multi_line(&mut response) {
                    Ok(_) => {
                        // println!("{}", String::from_utf8(response).unwrap());

                        Ok(())
                    }
                    Err(err) => Err(err),
                }
            }
            Err(err) => Err(err),
        }
    }

    pub fn list(&mut self, msg_number: Option<u32>) -> io::Result<Either<Vec<ListItem>, ListItem>> {
        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let mut list_command = String::from("LIST");

        let is_single: bool = msg_number.is_some();

        if is_single {
            let number = msg_number.unwrap();
            list_command.push_str(format!(" {}", number).as_ref());
        };

        match socket.send_bytes(list_command.as_bytes()) {
            Ok(_) => {
                if is_single {
                    let response = socket.read_response();

                    match response {
                        Ok(response) => match response.map_err(map_string_to_error) {
                            Ok(response) => {
                                let parser = Parser::new(response);

                                Ok(Right(parser.to_list_item()))
                            }
                            Err(err) => Err(err),
                        },
                        Err(err) => Err(err),
                    }
                } else {
                    match socket.read_response() {
                        Ok(status_message) => match status_message.map_err(map_string_to_error) {
                            Ok(status_message) => status_message,
                            Err(err) => return Err(err),
                        },
                        Err(err) => return Err(err),
                    };

                    let mut response: Vec<u8> = Vec::new();

                    match socket.read_multi_line(&mut response) {
                        Ok(_) => {
                            let response = String::from_utf8(response).unwrap();

                            let parser = Parser::new(response);

                            Ok(Left(parser.to_list()))
                        }
                        Err(err) => Err(err),
                    }
                }
            }
            Err(err) => Err(err),
        }
    }

    pub fn stat(&mut self) -> io::Result<Stats> {
        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let stat_command = b"STAT";

        match socket.send_command(stat_command) {
            Ok(response) => match response.map_err(map_string_to_error) {
                Ok(response) => {
                    let parser = Parser::new(response);

                    let stats = parser.to_stats();

                    Ok(stats)
                }
                Err(err) => Err(err),
            },
            Err(err) => Err(err),
        }
    }

    pub fn login(&mut self, user: &str, password: &str) -> io::Result<()> {
        if self.state != ClientState::Authentication {
            return Err(io::Error::new(
                io::ErrorKind::Other,
                "Client is not in authentication state, please logout",
            ));
        };

        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let user_string = format!("USER {}", user);

        match socket.send_command(user_string.as_bytes()) {
            Ok(user_response) => match user_response.map_err(map_string_to_error) {
                Ok(_) => {
                    let password_string = format!("PASS {}", password);

                    match socket.send_command(password_string.as_bytes()) {
                        Ok(password_response) => {
                            match password_response.map_err(map_string_to_error) {
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
                Err(err) => Err(err),
            },
            Err(err) => Err(err),
        }
    }

    pub fn logout(&mut self) -> io::Result<()> {
        if self.state != ClientState::Transaction {
            return Err(io::Error::new(
                io::ErrorKind::Other,
                "Client is not in transaction state, please login",
            ));
        };

        let socket = match self.get_socket_mut() {
            Ok(socket) => socket,
            Err(err) => return Err(err),
        };

        let quit_command = b"QUIT";

        match socket.send_command(quit_command) {
            Ok(response) => match response.map_err(map_string_to_error) {
                Ok(_) => {
                    self.state = ClientState::Update;
                    self.socket = None;
                    self.state = ClientState::None;
                    Ok(())
                }
                Err(err) => Err(err),
            },
            Err(err) => Err(err),
        }
    }

    // pub fn connect_plain(&mut self, server: &str, port: u16) -> io::Result<()> {
    //     match TcpStream::connect(format_server_string(server, port)) {
    //         Ok(stream) => {
    //             self.tcp_stream = Some(stream);
    //             Ok(())
    //         }
    //         Err(err) => Err(err),
    //     }
    // }

    pub fn connect(
        &mut self,
        server: &str,
        port: u16,
        tls_connector: &TlsConnector,
    ) -> io::Result<()> {
        match TcpStream::connect(format_server_string(server, port)) {
            Ok(tcp_stream) => match tls_connector
                .connect(server, tcp_stream)
                .map_err(map_native_tls_error)
            {
                Ok(tls_stream) => {
                    let socket = Socket::new(tls_stream);

                    self.socket = Some(socket);

                    self.state = ClientState::Authentication;

                    match self.read_greeting() {
                        Ok(_) => Ok(()),
                        Err(err) => Err(err),
                    }
                }
                Err(err) => Err(err),
            },
            Err(err) => Err(err),
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;

    struct ClientInfo {
        server: String,
        port: u16,
        username: String,
        password: String,
    }

    fn create_client_info() -> ClientInfo {
        ClientInfo {
            server: "pop.gmail.com".to_owned(),
            port: 995,
            username: "".to_owned(),
            password: "".to_owned(),
        }
    }

    fn create_logged_in_client() -> Client {
        let mut client = Client::new();

        let client_info = create_client_info();

        let server = client_info.server.as_ref();
        let port = client_info.port;

        let username = client_info.username.as_ref();
        let password = client_info.password.as_ref();

        let tls_connector = TlsConnector::new().unwrap();

        client.connect(server, port, &tls_connector).unwrap();

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

        client.connect(server, port, &tls_connector).unwrap()
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

        client.connect(server, port, &tls_connector).unwrap();

        client.login(username, password).unwrap();
    }

    #[test]
    fn logout() {
        let mut client = Client::new();

        let client_info = create_client_info();

        let server = client_info.server.as_ref();
        let port = client_info.port;

        let username = client_info.username.as_ref();
        let password = client_info.password.as_ref();

        let tls_connector = TlsConnector::new().unwrap();

        client.connect(server, port, &tls_connector).unwrap();

        client.login(username, password).unwrap();

        client.logout().unwrap();
    }

    #[test]
    fn noop() {
        let mut client = create_logged_in_client();

        client.noop().unwrap();

        client.logout().unwrap();
    }

    #[test]
    fn stat() {
        let mut client = create_logged_in_client();

        let stats = client.stat().unwrap();

        println!("{}", stats.count());

        client.logout().unwrap();
    }

    #[test]
    fn list() {
        let mut client = create_logged_in_client();

        let list = client.list(None).unwrap();

        match list {
            Right(list_item) => {
                println!("{}", list_item.size());
            }
            Left(list) => {
                println!("{}", list.len());
            }
        }

        client.logout().unwrap();
    }

    #[test]
    fn retr() {
        let mut client = create_logged_in_client();

        client.retr(1).unwrap();

        client.logout().unwrap();
    }
}

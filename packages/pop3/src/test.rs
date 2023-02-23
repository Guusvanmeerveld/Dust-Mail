use std::{env, net::TcpStream};

use dotenv::dotenv;
use either::Either::{Left, Right};
// use native_tls::{TlsConnector, TlsStream};

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

// fn create_logged_in_client_tls() -> Client<TlsStream<TcpStream>> {
//     let client_info = create_client_info();
//     let server = client_info.server.as_ref();
//     let port = client_info.port;

//     let username = client_info.username.as_ref();
//     let password = client_info.password.as_ref();

//     let tls = TlsConnector::new().unwrap();

//     let mut client = super::connect((server, port), server, &tls, None).unwrap();

//     client.login(username, password).unwrap();

//     client
// }

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

use std::env;

// use async_native_tls::{TlsConnector, TlsStream};
use dotenv::dotenv;
use tokio::net::TcpStream;

use crate::{types::StatsResponse, ClientState};

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

async fn create_logged_in_client() -> Client<TcpStream> {
    let client_info = create_client_info();
    let server = client_info.server.as_ref();
    let port = client_info.port;

    let username = client_info.username;
    let password = client_info.password;

    let mut client = super::connect_plain((server, port), None).await.unwrap();

    client.login(username, password).await.unwrap();

    client
}

// async fn create_logged_in_client_tls() -> Client<TlsStream<TcpStream>> {
//     let client_info = create_client_info();
//     let server = client_info.server.as_ref();
//     let port = client_info.port;

//     let username = client_info.username;
//     let password = client_info.password;

//     let tls = TlsConnector::new();

//     let mut client = super::connect((server, port), server, &tls, None)
//         .await
//         .unwrap();

//     client.login(username, password).await.unwrap();

//     client
// }

#[tokio::test]
async fn connect() {
    let client_info = create_client_info();

    let server = client_info.server.as_ref();
    let port = client_info.port;

    let mut client = super::connect_plain((server, port), None).await.unwrap();

    let greeting = client.greeting().unwrap();

    assert_eq!(greeting, "POP3 GreenMail Server v1.6.12 ready");

    client.quit().await.unwrap()
}

#[tokio::test]
async fn login() {
    let mut client = create_logged_in_client().await;

    assert_eq!(client.get_state(), &ClientState::Transaction);

    client.quit().await.unwrap();
}

#[tokio::test]
async fn noop() {
    let mut client = create_logged_in_client().await;

    assert_eq!(client.noop().await.unwrap(), ());

    client.quit().await.unwrap();
}

#[tokio::test]
async fn stat() {
    let mut client = create_logged_in_client().await;

    let stats = client.stat().await.unwrap();

    assert_eq!(stats, (0, 0));

    client.quit().await.unwrap();
}

#[tokio::test]
async fn list() {
    let mut client = create_logged_in_client().await;

    // let list = client.list(Some(4)).unwrap();

    // match list {
    //     Right(list_item) => {
    //         println!("{}", list_item.0);
    //     }
    //     _ => {}
    // };

    let list = client.list(None).await.unwrap();

    match list {
        StatsResponse::StatsList(list) => {
            assert_eq!(list, Vec::new());
        }
        _ => {}
    };

    client.quit().await.unwrap();
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

use std::env;

use dotenv::dotenv;

use crate::types::IncomingClientType;

use super::incoming::{IncomingClientBuilder, IncomingSession};

async fn create_session() -> Box<dyn IncomingSession> {
    dotenv().ok();

    let username = env::var("IMAP_USERNAME").unwrap();
    let password = env::var("IMAP_PASSWORD").unwrap();

    let server = env::var("IMAP_SERVER").unwrap();
    let port: u16 = 993;

    let client = IncomingClientBuilder::new(&IncomingClientType::Imap)
        .set_server(server)
        .set_port(port)
        .build()
        .await
        .unwrap();

    let session = client.login(&username, &password).await.unwrap();

    session
}

#[tokio::test]
async fn logout() {
    let mut session = create_session().await;

    session.logout().await.unwrap();
}

#[tokio::test]
async fn box_list() {
    let mut session = create_session().await;

    let list = session.box_list().await.unwrap();

    for mailbox in list {
        println!("{}", mailbox.counts().unwrap().total());
    }
}

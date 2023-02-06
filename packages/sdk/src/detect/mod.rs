use std::sync::Arc;

use futures::future::join_all;
use tokio::task::{spawn_blocking, JoinHandle};

use crate::types::{ConnectionSecurity, Error, ErrorKind, IncomingClientType, Result};

mod parse;
mod service;
mod types;

#[cfg(feature = "autoconfig")]
use parse::AutoConfigParser;

use types::{AuthenticationType, ConfigType, ServerConfig, ServerConfigType, Socket};

pub use types::Config;

const AT_SYMBOL: &str = "@";

/// Given an array of sockets (domain name, port and connection security) check which of the sockets have a server of a given mail server type running on them.
async fn check_sockets(sockets: Vec<Socket>, client_type: IncomingClientType) -> Vec<Socket> {
    let working_socket_results: Vec<JoinHandle<Result<Option<IncomingClientType>>>> = sockets
        .clone()
        .into_iter()
        .map(move |(domain, port, security)| {
            spawn_blocking(move || service::from_server(&domain, &port, &security))
        })
        .collect();

    let working_sockets = join_all(working_socket_results)
        .await
        .into_iter()
        .enumerate()
        .filter_map(|(i, result)| match result.unwrap() {
            Ok(result) => {
                if result? == client_type {
                    Some(sockets[i].clone())
                } else {
                    None
                }
            }
            Err(_) => None,
        })
        .collect();

    working_sockets
}

/// Automatically detect an email providers config for a given email address
pub async fn from_email(email_address: &str) -> Result<Config> {
    let mut config: Option<Config> = None;

    let mut split = email_address.split(AT_SYMBOL);

    // Skip the prefix
    split.next();

    let domain = Arc::new(split.next().unwrap().to_string());

    #[cfg(feature = "autoconfig")]
    {
        let domain_clone = domain.clone();

        let detected_autoconfig = spawn_blocking(move || {
            autoconfig::from_domain(&domain_clone).map_err(|e| {
                Error::new(
                    ErrorKind::FetchConfigFailed,
                    format!(
                        "Error when requesting config from email provider: {}",
                        e.message()
                    ),
                )
            })
        })
        .await
        .unwrap()?;

        match detected_autoconfig {
            Some(detected_autoconfig) => {
                config = Some(AutoConfigParser::parse(detected_autoconfig)?)
            }
            None => {}
        }
    }
    // TODO: Check for domains such mail.domain.com, imap.domain.com etc.
    if config.is_none() {
        let mail_domain = format!("mail.{}", domain);

        let mut incoming_configs: Vec<ServerConfig> = Vec::new();
        let mut outgoing_configs: Vec<ServerConfig> = Vec::new();

        #[cfg(feature = "imap")]
        {
            let secure_imap_port: u16 = 993;
            let imap_port: u16 = 143;

            let imap_domain = format!("imap.{}", domain);

            let sockets_to_check: Vec<Socket> = vec![
                (
                    mail_domain.to_string(),
                    secure_imap_port,
                    ConnectionSecurity::Tls,
                ),
                (
                    imap_domain.clone(),
                    secure_imap_port,
                    ConnectionSecurity::Tls,
                ),
                (
                    mail_domain.to_string(),
                    imap_port,
                    ConnectionSecurity::Plain,
                ),
                (imap_domain, imap_port, ConnectionSecurity::Plain),
            ];

            // Check mail.domain.tld and imap.domain.tld on the default secure imap port
            let working_sockets = check_sockets(sockets_to_check, IncomingClientType::Imap).await;

            if working_sockets.len() > 0 {
                let mut working_sockets = working_sockets.into_iter();

                let socket_to_use = match working_sockets.next() {
                    Some(socket) => socket,
                    // We know the array is larger than 0 items
                    None => unreachable!(),
                };

                let config: ServerConfig = ServerConfig::new(
                    ServerConfigType::Imap,
                    socket_to_use.1,
                    socket_to_use.0,
                    socket_to_use.2,
                    vec![AuthenticationType::ClearText],
                );

                incoming_configs.push(config);
            }
        }

        #[cfg(feature = "pop")]
        {
            let secure_pop_port: u16 = 995;
            let pop_port: u16 = 110;

            let pop_domain = format!("pop.{}", domain);

            let sockets_to_check: Vec<Socket> = vec![
                (
                    mail_domain.clone(),
                    secure_pop_port,
                    ConnectionSecurity::Tls,
                ),
                (pop_domain.clone(), secure_pop_port, ConnectionSecurity::Tls),
                (mail_domain, pop_port, ConnectionSecurity::Plain),
                (pop_domain, pop_port, ConnectionSecurity::Plain),
            ];

            let working_sockets = check_sockets(sockets_to_check, IncomingClientType::Pop).await;
        }

        if incoming_configs.len() > 0 || outgoing_configs.len() > 0 {
            let domain = domain.as_str();

            config = Some(Config::new(
                ConfigType::new_multiserver(incoming_configs, outgoing_configs),
                domain,
                domain,
            ));
        }
    }

    match config {
        Some(config) => Ok(config),
        None => Err(Error::new(
            ErrorKind::ConfigNotFound,
            "Could not detect an email server config from the given email address",
        )),
    }
}

mod test {
    #[tokio::test]
    async fn from_email() {
        let email = "mail@samtaen.nl";

        let config = super::from_email(email).await.unwrap();

        println!("{}", config.to_json().unwrap());
    }
}

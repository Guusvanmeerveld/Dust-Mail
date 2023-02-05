use std::sync::Arc;

use futures::future::join_all;
use serde::Serialize;
use tokio::task::{spawn_blocking, JoinHandle};

use crate::{
    parse::to_json,
    types::{self, ConnectionSecurity, IncomingClientType},
};

mod parse;
mod service;

#[cfg(feature = "autoconfig")]
use parse::AutoConfigParser;

const AT_SYMBOL: &str = "@";

#[derive(Debug, Serialize)]
pub enum ServerConfigType {
    Imap,
    Pop,
    Smtp,
    Exchange,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerConfig {
    r#type: ServerConfigType,
    port: u16,
    domain: String,
    security: ConnectionSecurity,
    auth_type: Vec<AuthenticationType>,
}

impl ServerConfig {
    pub fn port(&self) -> &u16 {
        &self.port
    }

    pub fn domain(&self) -> &str {
        &self.domain
    }

    pub fn security(&self) -> &ConnectionSecurity {
        &self.security
    }

    pub fn auth_type(&self) -> &Vec<AuthenticationType> {
        &self.auth_type
    }
}

#[derive(Debug, Serialize)]
pub enum AuthenticationType {
    ClearText,
    Encrypted,
    OAuth2,
    None,
    Unknown,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ConfigType {
    MultiServer {
        incoming: Vec<ServerConfig>,
        outgoing: Vec<ServerConfig>,
    },
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    r#type: ConfigType,
    provider: String,
    display_name: String,
}

impl Config {
    /// The kind of config
    pub fn config_type(&self) -> &ConfigType {
        &self.r#type
    }

    /// The email provider name
    pub fn provider(&self) -> &str {
        &self.provider
    }

    /// The display name for the email provider
    pub fn display_name(&self) -> &str {
        &self.display_name
    }

    pub fn to_json(&self) -> types::Result<String> {
        to_json(self)
    }
}

type Socket = (String, u16, ConnectionSecurity);

async fn check_sockets(sockets: Vec<Socket>, client_type: IncomingClientType) -> Vec<Socket> {
    let working_socket_results: Vec<JoinHandle<types::Result<Option<IncomingClientType>>>> =
        sockets
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
pub async fn from_email(email_address: &str) -> types::Result<Config> {
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
                types::Error::new(
                    types::ErrorKind::FetchConfigFailed,
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

                let config: ServerConfig = ServerConfig {
                    r#type: ServerConfigType::Imap,
                    domain: socket_to_use.0,
                    port: socket_to_use.1,
                    security: socket_to_use.2,
                    auth_type: vec![AuthenticationType::ClearText],
                };

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
            config = Some(Config {
                display_name: domain.to_string(),
                provider: domain.to_string(),
                r#type: ConfigType::MultiServer {
                    incoming: incoming_configs,
                    outgoing: outgoing_configs,
                },
            })
        }
    }

    match config {
        Some(config) => Ok(config),
        None => Err(types::Error::new(
            types::ErrorKind::ConfigNotFound,
            "Could not detect an email server config from the given email address",
        )),
    }
}

mod test {
    #[tokio::test]
    async fn from_email() {
        let email = "hello@mail@samtaen.nl";

        let config = super::from_email(email).await.unwrap();

        println!("{}", config.to_json().unwrap());
    }
}

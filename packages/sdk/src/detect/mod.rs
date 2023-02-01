use serde::Serialize;

use crate::{
    parse::to_json,
    types::{self, ConnectionSecurity, ErrorKind},
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

/// Automatically detect an email providers config for a given email address
pub fn from_email(email_address: &str) -> types::Result<Config> {
    let mut config: Option<Config> = None;

    let mut split = email_address.split(AT_SYMBOL);

    // Skip the prefix
    split.next();

    let domain = split.next().unwrap();

    #[cfg(feature = "autoconfig")]
    {
        let detected_autoconfig = autoconfig::from_domain(domain).map_err(|e| {
            types::Error::new(
                types::ErrorKind::FetchConfigFailed,
                format!(
                    "Error when requesting config from email provider: {}",
                    e.message()
                ),
            )
        })?;

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

            let addresses_to_check: Vec<(&str, u16, ConnectionSecurity)> = vec![
                (
                    mail_domain.as_str(),
                    secure_imap_port,
                    ConnectionSecurity::Tls,
                ),
                (
                    imap_domain.as_str(),
                    secure_imap_port,
                    ConnectionSecurity::Tls,
                ),
                // (mail_domain.as_str(), imap_port, ConnectionSecurity::Plain),
                // (imap_domain.as_str(), imap_port, ConnectionSecurity::Plain),
            ];

            // Check mail.domain.tld and imap.domain.tld on the default secure imap port
            let working_addresses: Vec<(&&str, &u16)> = addresses_to_check
                .iter()
                .filter_map(|(domain, port, security)| {
                    match service::from_server(domain, *port, security) {
                        Ok(_) => Some((domain, port)),
                        Err(error) => match error.kind() {
                            ErrorKind::Connect => None,
                            _ => None,
                        },
                    }
                })
                .collect();

            if working_addresses.len() > 0 {
                let address_to_use = match working_addresses.first() {
                    Some(address) => address,
                    // We know the array is larger than 0 items
                    None => unreachable!(),
                };

                let config: ServerConfig = ServerConfig {
                    r#type: ServerConfigType::Imap,
                    port: *address_to_use.1,
                    domain: address_to_use.0.to_string(),
                    security: ConnectionSecurity::Tls,
                    auth_type: vec![AuthenticationType::ClearText],
                };

                incoming_configs.push(config);
            }
        }

        #[cfg(feature = "pop")]
        {
            // let mail_domain_pop = service::from_server(&mail_domain, 995, ConnectionSecurity::Tls);
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
    #[test]
    fn from_email() {
        let email = "mail@samtaen.nl";

        let config = super::from_email(email).unwrap();

        println!("{}", config.to_json().unwrap());
    }
}

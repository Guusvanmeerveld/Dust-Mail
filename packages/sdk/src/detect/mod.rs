#[cfg(feature = "autoconfig")]
use autoconfig::{
    self,
    types::config::{
        AuthenticationType as AutoConfigAuthenticationType, Config as AutoConfig,
        SecurityType as AutoConfigSecurityType, ServerType as AutoConfigServerType,
    },
};
use serde::Serialize;

use crate::{
    parse,
    types::{self, ConnectionSecurity},
};

mod service;

pub use service::from_server;

#[derive(Debug, Serialize)]
pub enum MailServerConfig {
    Pop(ServerConfig),
    Imap(ServerConfig),
    Smtp(ServerConfig),
    Exchange(ServerConfig),
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerConfig {
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
    MultiServer(Vec<MailServerConfig>),
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
        parse::to_json(self)
    }
}

#[cfg(feature = "autoconfig")]
fn autoconfig_to_config(autoconfig: AutoConfig) -> types::Result<Config> {
    let provider: String = autoconfig.email_provider().id().into();
    let display_name: String = autoconfig.email_provider().display_name().unwrap().into();

    let servers: Vec<MailServerConfig> = autoconfig
        .email_provider()
        .servers()
        .iter()
        .filter_map(|server| {
            let domain: String = server.hostname()?.to_string();

            let port: u16 = *server.port()?;

            let security: ConnectionSecurity = match server.security_type() {
                Some(security) => match security {
                    AutoConfigSecurityType::Plain => ConnectionSecurity::Plain,
                    AutoConfigSecurityType::Starttls => ConnectionSecurity::StartTls,
                    AutoConfigSecurityType::Tls => ConnectionSecurity::Tls,
                },
                None => return None,
            };

            let auth_type: Vec<AuthenticationType> = server
                .authentication_type()
                .iter()
                .map(|authentication_type| match authentication_type {
                    AutoConfigAuthenticationType::None => AuthenticationType::None,
                    AutoConfigAuthenticationType::PasswordCleartext => {
                        AuthenticationType::ClearText
                    }
                    AutoConfigAuthenticationType::PasswordEncrypted => {
                        AuthenticationType::Encrypted
                    }
                    AutoConfigAuthenticationType::OAuth2 => AuthenticationType::OAuth2,
                    _ => AuthenticationType::Unknown,
                })
                .collect();

            let server_config = ServerConfig {
                domain,
                port,
                security,
                auth_type,
            };

            let server_type = match server.server_type() {
                AutoConfigServerType::Imap => MailServerConfig::Imap(server_config),
                AutoConfigServerType::Pop3 => MailServerConfig::Pop(server_config),
                AutoConfigServerType::Smtp => MailServerConfig::Smtp(server_config),
                AutoConfigServerType::Exchange => MailServerConfig::Exchange(server_config),
            };

            Some(server_type)
        })
        .collect();

    let config_type = ConfigType::MultiServer(servers);

    let config = Config {
        r#type: config_type,
        provider,
        display_name,
    };

    Ok(config)
}

/// Automatically detect an email providers config for a given email address
pub fn from_email(email_address: &str) -> types::Result<Config> {
    let mut config: Option<Config> = None;

    #[cfg(feature = "autoconfig")]
    {
        let detected_autoconfig = autoconfig::from_addr(email_address).map_err(|e| {
            types::Error::new(
                types::ErrorKind::FetchConfigFailed,
                format!(
                    "Error when requesting config from email provider: {}",
                    e.message()
                ),
            )
        })?;

        match detected_autoconfig {
            Some(detected_autoconfig) => config = Some(autoconfig_to_config(detected_autoconfig)?),
            None => {}
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
        let email = "guusvanmeerveld@outlook.com";

        let config = super::from_email(email).unwrap();

        println!("{}", config.to_json().unwrap());
    }
}

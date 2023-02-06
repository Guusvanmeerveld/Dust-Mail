use serde::Serialize;

use crate::{
    parse::to_json,
    types::{ConnectionSecurity, Result},
};

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
    pub fn new<S: Into<String>>(
        r#type: ServerConfigType,
        port: u16,
        domain: S,
        security: ConnectionSecurity,
        auth_type: Vec<AuthenticationType>,
    ) -> Self {
        Self {
            r#type,
            port,
            domain: domain.into(),
            security,
            auth_type,
        }
    }

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

impl ConfigType {
    pub fn new_multiserver(incoming: Vec<ServerConfig>, outgoing: Vec<ServerConfig>) -> Self {
        ConfigType::MultiServer { incoming, outgoing }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    r#type: ConfigType,
    provider: String,
    display_name: String,
}

impl Config {
    pub fn new<S: Into<String>>(r#type: ConfigType, provider: S, display_name: S) -> Self {
        Self {
            display_name: display_name.into(),
            provider: provider.into(),
            r#type,
        }
    }

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

    pub fn to_json(&self) -> Result<String> {
        to_json(self)
    }
}

pub type Socket = (String, u16, ConnectionSecurity);

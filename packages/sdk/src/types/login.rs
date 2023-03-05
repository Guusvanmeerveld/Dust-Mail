use serde::{Deserialize, Serialize};

pub struct ConnectOptions {
    server: String,
    port: u16,
}

impl ConnectOptions {
    pub fn new<S: Into<String>>(server: S, port: &u16) -> Self {
        Self {
            server: server.into(),
            port: *port,
        }
    }

    pub fn server(&self) -> &str {
        &self.server
    }

    pub fn port(&self) -> &u16 {
        &self.port
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConnectionSecurity {
    Tls,
    StartTls,
    Plain,
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LoginOptions {
    username: String,
    password: String,
    domain: String,
    port: u16,
    security: ConnectionSecurity,
}

impl LoginOptions {
    pub fn domain(&self) -> &str {
        &self.domain
    }

    pub fn port(&self) -> &u16 {
        &self.port
    }

    pub fn security(&self) -> &ConnectionSecurity {
        &self.security
    }

    pub fn username(&self) -> &str {
        &self.username
    }

    pub fn password(&self) -> &str {
        &self.password
    }
}

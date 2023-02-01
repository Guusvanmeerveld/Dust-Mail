use serde::{Deserialize, Serialize};

pub struct LoginOptions {
    server: String,
    port: u16,
}

impl LoginOptions {
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

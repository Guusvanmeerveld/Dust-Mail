use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConnectionSecurity {
    Tls,
    StartTls,
    Plain,
}

mod appearance;
mod authorization;
mod limit;

use rocket::serde::{Deserialize, Serialize};

use std::env;

use appearance::Appearance;
use authorization::Authorization;
use limit::RateLimit;

#[derive(Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct Config {
    #[serde(default = "default_port")]
    port: u16,
    #[serde(default = "default_host")]
    host: String,
    #[serde(default = "behind_proxy")]
    behind_proxy: bool,
    #[serde(default)]
    rate_limit: RateLimit,
    appearance: Appearance,
    auth: Authorization,
}

impl Config {
    pub fn port(&self) -> &u16 {
        &self.port
    }

    pub fn host(&self) -> &str {
        &self.host
    }

    pub fn behind_proxy(&self) -> &bool {
        &self.behind_proxy
    }

    pub fn rate_limit(&self) -> &RateLimit {
        &self.rate_limit
    }

    pub fn appearance(&self) -> &Appearance {
        &self.appearance
    }

    pub fn authorization(&self) -> &Authorization {
        &self.auth
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            appearance: Appearance::default(),
            auth: Authorization::default(),
            rate_limit: RateLimit::default(),
            behind_proxy: behind_proxy(),
            host: default_host(),
            port: default_port(),
        }
    }
}

fn behind_proxy() -> bool {
    env::var("BEHIND_PROXY")
        .map(|value| value.to_ascii_lowercase().eq("true"))
        .unwrap_or(false)
}

fn default_host() -> String {
    String::from("0.0.0.0")
}

fn default_port() -> u16 {
    8080
}

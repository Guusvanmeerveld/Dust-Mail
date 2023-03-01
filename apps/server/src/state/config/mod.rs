mod appearance;
mod authorization;
mod cache;
mod limit;

use rocket::serde::{Deserialize, Serialize};

use std::env;

use appearance::Appearance;
use authorization::Authorization;
use cache::Cache;
use limit::RateLimit;

pub use authorization::{default_expiry_time, AuthType};

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
    #[serde(default)]
    appearance: Appearance,
    #[serde(default)]
    cache: Cache,
    auth: Option<Authorization>,
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

    pub fn cache(&self) -> &Cache {
        &self.cache
    }

    pub fn appearance(&self) -> &Appearance {
        &self.appearance
    }

    pub fn authorization(&self) -> Option<&Authorization> {
        self.auth.as_ref()
    }
}

impl Default for Config {
    fn default() -> Self {
        let auth = if !cfg!(debug_assertions) {
            Some(Authorization::default())
        } else {
            None
        };

        Self {
            appearance: Appearance::default(),
            auth,
            rate_limit: RateLimit::default(),
            cache: Cache::default(),
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

use rocket::serde::{Deserialize, Serialize};

use std::env;

use crate::constants;

#[derive(Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct Config {
    #[serde(default = "default_port")]
    port: u16,
    #[serde(default = "default_host")]
    host: String,
    #[serde(default = "behind_proxy")]
    behind_proxy: bool,
    appearance: Option<Appearance>,
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

    pub fn appearance(&self) -> Option<&Appearance> {
        self.appearance.as_ref()
    }

    pub fn authorization(&self) -> Option<&Authorization> {
        self.auth.as_ref()
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            appearance: None,
            auth: None,
            behind_proxy: behind_proxy(),
            host: default_host(),
            port: default_port(),
        }
    }
}

#[derive(Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct Appearance {
    #[serde(default = "default_name")]
    name: String,
    #[serde(default = "default_description")]
    description: String,
}

impl Appearance {
    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn description(&self) -> &str {
        &self.description
    }
}

#[derive(Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct Authorization {
    #[serde(default = "empty_vec")]
    admins: Vec<String>,
    #[serde(default = "allow_registration")]
    allow_registration: bool,
}

impl Authorization {
    pub fn admins(&self) -> &Vec<String> {
        &self.admins
    }

    pub fn is_admin(&self, address: &str) -> bool {
        self.admins.iter().find(|item| item.eq(&address)).is_some()
    }

    pub fn allow_registration(&self) -> &bool {
        &self.allow_registration
    }
}

fn allow_registration() -> bool {
    true
}

fn empty_vec() -> Vec<String> {
    Vec::new()
}

fn default_description() -> String {
    String::from("A Dust-Mail backend server")
}

fn default_name() -> String {
    String::from(constants::APP_NAME)
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

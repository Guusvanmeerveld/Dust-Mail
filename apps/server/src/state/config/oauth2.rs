use std::collections::HashMap;

use rocket::serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct OAuth2 {
    providers: HashMap<String, Provider>,
}

impl OAuth2 {
    pub fn providers(&self) -> &HashMap<String, Provider> {
        &self.providers
    }
}

impl Default for OAuth2 {
    fn default() -> Self {
        Self {
            providers: HashMap::new(),
        }
    }
}

#[derive(Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct Provider {
    public_token: String,
    secret_token: Option<String>,
    token_url: String,
}

impl Provider {
    pub fn public_token(&self) -> &str {
        &self.public_token
    }

    pub fn secret_token(&self) -> &Option<String> {
        &self.secret_token
    }

    pub fn token_url(&self) -> &str {
        &self.token_url
    }
}

use std::env;

use rocket::serde::{Deserialize, Serialize};

use crate::utils::{self, generate_random_hex};

#[derive(Deserialize, Serialize, Clone)]
#[serde(crate = "rocket::serde")]
pub struct Authorization {
    secret: String,
    #[serde(default = "default_expiry_time")]
    expires: i64,
    #[serde(default = "default_connection_limit")]
    connection_limit: usize,
    user: Option<User>,
    password: Option<Password>,
    r#type: AuthType,
}

impl Authorization {
    pub fn secret(&self) -> &str {
        &self.secret
    }

    pub fn expires(&self) -> &i64 {
        &self.expires
    }

    pub fn user(&self) -> Option<&User> {
        self.user.as_ref()
    }

    pub fn password(&self) -> Option<&Password> {
        self.password.as_ref()
    }

    pub fn connection_limit(&self) -> &usize {
        &self.connection_limit
    }

    pub fn auth_type(&self) -> &AuthType {
        &self.r#type
    }
}

impl Default for Authorization {
    fn default() -> Self {
        let auth_type = AuthType::default();

        let password = match auth_type {
            AuthType::Password => Some(Password::default()),
            _ => None,
        };

        let user = match auth_type {
            AuthType::User => Some(User::default()),
            _ => None,
        };

        Self {
            secret: generate_random_hex(32),
            expires: default_expiry_time(),
            connection_limit: default_connection_limit(),
            user,
            password,
            r#type: auth_type,
        }
    }
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(crate = "rocket::serde", rename_all = "snake_case")]
pub enum AuthType {
    Password,
    User,
}

impl Default for AuthType {
    fn default() -> Self {
        Self::Password
    }
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(crate = "rocket::serde")]
pub struct User {
    #[serde(default = "empty_vec")]
    admins: Vec<String>,
    #[serde(default = "allow_registration")]
    allow_registration: bool,
}

impl User {
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

impl Default for User {
    fn default() -> Self {
        Self {
            admins: empty_vec(),
            allow_registration: allow_registration(),
        }
    }
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(crate = "rocket::serde")]
pub struct Password {
    password: String,
}

impl Password {
    pub fn password(&self) -> &str {
        &self.password
    }
}

impl Default for Password {
    fn default() -> Self {
        Self {
            password: generate_random_password(),
        }
    }
}

pub fn default_connection_limit() -> usize {
    5
}

pub fn default_expiry_time() -> i64 {
    7 * 24 * 60 * 60
}

fn generate_random_password() -> String {
    env::var("PASSWORD").unwrap_or(utils::generate_random_string(32))
}

fn allow_registration() -> bool {
    true
}

fn empty_vec() -> Vec<String> {
    Vec::new()
}

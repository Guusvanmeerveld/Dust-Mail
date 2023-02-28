use rocket::serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct Cache {
    #[serde(default = "default_timeout")]
    timeout: u64,
}

impl Cache {
    pub fn timeout(&self) -> &u64 {
        &self.timeout
    }
}

impl Default for Cache {
    fn default() -> Self {
        Self {
            timeout: default_timeout(),
        }
    }
}

pub fn default_timeout() -> u64 {
    60 * 5
}

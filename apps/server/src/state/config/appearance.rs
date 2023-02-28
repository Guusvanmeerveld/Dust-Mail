use rocket::serde::{Deserialize, Serialize};

use crate::constants;

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

impl Default for Appearance {
    fn default() -> Self {
        Self {
            description: default_description(),
            name: default_name(),
        }
    }
}

fn default_description() -> String {
    String::from("A Dust-Mail backend server")
}

fn default_name() -> String {
    String::from(constants::APP_NAME)
}

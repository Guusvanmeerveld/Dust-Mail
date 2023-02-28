use rocket::serde::{Deserialize, Serialize};

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

impl Default for Authorization {
    fn default() -> Self {
        Self {
            admins: empty_vec(),
            allow_registration: allow_registration(),
        }
    }
}

fn allow_registration() -> bool {
    true
}

fn empty_vec() -> Vec<String> {
    Vec::new()
}

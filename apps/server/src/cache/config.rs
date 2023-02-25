use std::{
    collections::HashMap,
    sync::Mutex,
    time::{Duration, Instant},
};

use crate::{types::Result, utils::get_domain_from_email};

use sdk::detect::Config;

pub struct ConfigCache {
    configs: Mutex<HashMap<String, (Instant, Config)>>,
}

const CACHE_TIMEOUT: Duration = Duration::from_secs(60 * 5);

impl ConfigCache {
    pub fn new() -> Self {
        Self {
            configs: Mutex::new(HashMap::new()),
        }
    }

    pub fn set(&self, email: &str, config: Config) -> Result<()> {
        let domain = get_domain_from_email(email)?;

        let mut config_write_lock = self.configs.lock().unwrap();

        let now = Instant::now();

        config_write_lock.insert(String::from(domain), (now, config));

        Ok(())
    }

    pub fn get(&self, email: &str) -> Option<Config> {
        let domain = get_domain_from_email(email).ok()?;

        let config_read_lock = self.configs.lock().unwrap();

        match config_read_lock.get(domain) {
            Some((age, value)) => {
                let now = Instant::now();

                if !now
                    .duration_since(*age)
                    .saturating_sub(CACHE_TIMEOUT)
                    .is_zero()
                {
                    return None;
                }

                Some(value.clone())
            }
            None => None,
        }
    }
}

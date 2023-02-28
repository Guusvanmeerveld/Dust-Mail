use std::time::Instant;

use crate::{types::Result, utils::get_domain_from_email};

use dashmap::DashMap;
use sdk::detect::Config;

use super::CachedItem;

pub struct ConfigCache {
    configs: DashMap<String, CachedItem<Config>>,
}

impl ConfigCache {
    pub fn new() -> Self {
        Self {
            configs: DashMap::new(),
        }
    }

    pub fn set(&self, email: &str, config: &Config) -> Result<()> {
        let domain = get_domain_from_email(email)?;

        let now = Instant::now();

        self.configs
            .insert(String::from(domain), CachedItem::new(config));

        Ok(())
    }

    pub fn get(&self, email: &str) -> Option<Config> {
        let domain = get_domain_from_email(email).ok()?;

        match self.configs.get(domain) {
            Some(entry) => {
                if entry.expired() {
                    return None;
                }

                let config = entry.item();

                Some(config)
            }
            None => None,
        }
    }
}

use std::time::Instant;

use crate::{types::Result, utils::get_domain_from_email};

use dashmap::DashMap;
use sdk::detect::Config;

use super::CachedItem;

pub struct ConfigCache {
    cache_timeout: u64,
    configs: DashMap<String, CachedItem<Config>>,
}

impl ConfigCache {
    pub fn new(cache_timeout: &u64) -> Self {
        Self {
            cache_timeout: cache_timeout.clone(),
            configs: DashMap::new(),
        }
    }

    pub fn set(&self, email: &str, config: &Config) -> Result<()> {
        let domain = get_domain_from_email(email)?;

        let now = Instant::now();

        self.configs.insert(
            String::from(domain),
            CachedItem::new(config, &self.cache_timeout),
        );

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

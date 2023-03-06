use std::sync::Arc;

use crate::{types::Result, utils::get_domain_from_email};

use dashmap::DashMap;
use sdk::detect::Config;

use super::CachedItem;

pub struct ConfigCache {
    cache_timeout: u64,
    configs: DashMap<String, Arc<CachedItem<Config>>>,
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

        let cached_item = Arc::new(CachedItem::new(config, &self.cache_timeout));

        self.configs.insert(String::from(domain), cached_item);

        Ok(())
    }

    pub fn get(&self, email: &str) -> Option<Arc<CachedItem<Config>>> {
        let domain = get_domain_from_email(email).ok()?;

        match self.configs.get(domain) {
            Some(entry) => {
                if entry.expired() {
                    return None;
                }

                Some(Arc::clone(entry.value()))
            }
            None => None,
        }
    }
}

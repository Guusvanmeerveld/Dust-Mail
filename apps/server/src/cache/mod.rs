mod config;

use std::time::{Duration, Instant};

pub struct CachedItem<T> {
    cache_timeout: Duration,
    item: T,
    time: Instant,
}

impl<T: Clone> CachedItem<T> {
    pub fn new(item: &T, cache_timeout: &u64) -> Self {
        Self {
            item: item.clone(),
            time: Instant::now(),
            cache_timeout: Duration::from_secs(*cache_timeout),
        }
    }

    pub fn item(&self) -> &T {
        &self.item
    }

    pub fn expired(&self) -> bool {
        let now = Instant::now();

        !now.duration_since(self.time)
            .saturating_sub(self.cache_timeout)
            .is_zero()
    }
}

pub use config::ConfigCache;

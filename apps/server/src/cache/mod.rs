mod config;

use std::time::{Duration, Instant};

const CACHE_TIMEOUT: Duration = Duration::from_secs(60 * 5);

struct CachedItem<T> {
    item: T,
    time: Instant,
}

impl<T: Clone> CachedItem<T> {
    pub fn new(item: &T) -> Self {
        Self {
            item: item.clone(),
            time: Instant::now(),
        }
    }

    pub fn item(&self) -> T {
        self.item.clone()
    }

    pub fn expired(&self) -> bool {
        let now = Instant::now();

        !now.duration_since(self.time)
            .saturating_sub(CACHE_TIMEOUT)
            .is_zero()
    }
}

pub use config::ConfigCache;

use async_trait::async_trait;

use tokio::time::{Duration, Instant};

use crate::types::Result;

#[async_trait]
pub trait Refresher<T> {
    async fn refresh(&mut self) -> Result<T>;
}

/// A Cache struct that will automatically refresh the cached value when it has expired using a given refresher struct.
pub struct Cache<T> {
    cached: Option<T>,
    expiry_time: Duration,
    refreshed: Instant,
}

impl<T> Cache<T> {
    pub fn new(expiry_time: Duration) -> Self {
        Self {
            cached: None,
            expiry_time,
            refreshed: Instant::now(),
        }
    }

    /// Whether the cache has expired.
    pub fn is_expired(&self) -> bool {
        self.cached.is_none() || self.refreshed.checked_sub(self.expiry_time).is_none()
    }

    /// Get the cached item and refresh it if it has expired.
    pub async fn get<R: Refresher<T>>(&mut self, refresher: &mut R) -> Result<&T> {
        // If there is no cached value yet or the cache has expired, refresh it
        if self.is_expired() {
            let refreshed = refresher.refresh().await?;

            self.cached = Some(refreshed);

            self.refreshed = Instant::now();
        }

        match self.cached.as_ref() {
            Some(cached) => Ok(cached),
            // We check in the is_expired function whether self.cached is none, so it can never be none.
            None => unreachable!(),
        }
    }
}

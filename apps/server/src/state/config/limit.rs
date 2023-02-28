use std::time::Duration;

use rocket::serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct RateLimit {
    #[serde(default = "default_max_queries")]
    max_queries: usize,
    #[serde(default = "default_time_span")]
    time_span: u64,
}

impl RateLimit {
    pub fn max_queries(&self) -> &usize {
        &self.max_queries
    }

    pub fn time_span(&self) -> Duration {
        Duration::from_secs(self.time_span.clone())
    }
}

impl Default for RateLimit {
    fn default() -> Self {
        Self {
            max_queries: default_max_queries(),
            time_span: default_time_span(),
        }
    }
}

fn default_max_queries() -> usize {
    8
}

fn default_time_span() -> u64 {
    10
}

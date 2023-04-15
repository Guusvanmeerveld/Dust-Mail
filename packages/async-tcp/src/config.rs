use tokio::time::Duration;

#[derive(Clone)]
pub struct Config {
    timeout: Duration,
    error_on_timeout: bool,
}

impl Config {
    pub fn new(timeout: Duration, error_on_timeout: bool) -> Self {
        Self {
            timeout,
            error_on_timeout,
        }
    }

    pub fn timeout(&self) -> &Duration {
        &self.timeout
    }

    pub fn into_timeout(self) -> Duration {
        self.timeout
    }

    pub fn error_on_timeout(&self) -> bool {
        self.error_on_timeout
    }
}

impl Default for Config {
    fn default() -> Self {
        Self::new(Duration::from_secs(5), true)
    }
}

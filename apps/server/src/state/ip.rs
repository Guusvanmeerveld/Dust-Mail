use dashmap::DashMap;
use std::time::{Duration, Instant};

pub struct IpState {
    ip_list: DashMap<String, Vec<Instant>>,
    max_queries: usize,
    time_span: Duration,
}

impl IpState {
    pub fn new(max_queries: &usize, time_span: Duration) -> Self {
        Self {
            ip_list: DashMap::new(),
            max_queries: *max_queries,
            time_span,
        }
    }

    fn get_count_for_ip(&self, ip: &str) -> usize {
        let now = Instant::now();

        let mut history = self.ip_list.entry(String::from(ip)).or_insert(Vec::new());

        let time_range_to_check = self.time_span;

        *history = history
            .iter()
            .map(|request_time| *request_time)
            .filter(|request_time| {
                now.saturating_duration_since(*request_time)
                    .saturating_sub(time_range_to_check)
                    .is_zero()
            })
            .collect();

        history.len()
    }

    pub fn is_ip_limited(&self, ip: &str) -> bool {
        let request_count = self.get_count_for_ip(ip);

        request_count > self.max_queries
    }

    pub fn add_count_to_ip(&self, ip: &str) {
        let mut history = self.ip_list.entry(String::from(ip)).or_insert(Vec::new());

        history.push(Instant::now());
    }
}

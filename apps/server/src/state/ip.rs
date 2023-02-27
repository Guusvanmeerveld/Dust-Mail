use std::{collections::HashMap, sync::Mutex};

pub struct IpState {
    ip_list: Mutex<HashMap<String, u16>>,
}

impl<'a> IpState {
    pub fn new() -> Self {
        Self {
            ip_list: Mutex::new(HashMap::new()),
        }
    }

    pub fn get_count_for_ip(&self, ip: &str) -> Option<u16> {
        let read_lock = self.ip_list.lock().unwrap();

        read_lock.get(ip).cloned()
    }

    pub fn add_count_to_ip(&self, ip: &str) {
        let mut write_lock = self.ip_list.lock().unwrap();

        let value = write_lock.entry(String::from(ip)).or_insert(0);

        *value = value.saturating_add(1);
    }
}

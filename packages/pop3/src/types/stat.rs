pub struct Stats {
    message_count: u32,
    drop_size: u64,
}

impl Stats {
    pub fn new(message_count: u32, drop_size: u64) -> Self {
        Self {
            drop_size,
            message_count,
        }
    }

    pub fn count(&self) -> u32 {
        self.message_count
    }

    pub fn size(&self) -> u64 {
        self.drop_size
    }
}

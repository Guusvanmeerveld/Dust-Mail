pub struct ListItem {
    index: u32,
    size: u64,
}

impl ListItem {
    pub fn new(index: u32, size: u64) -> Self {
        Self { index, size }
    }

    pub fn index(&self) -> u32 {
        self.index
    }

    pub fn size(&self) -> u64 {
        self.size
    }
}

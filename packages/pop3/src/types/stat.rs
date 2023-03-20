pub type Stats = (u32, u64);

pub enum StatsResponse {
    Stats(Stats),
    StatsList(Vec<Stats>),
}

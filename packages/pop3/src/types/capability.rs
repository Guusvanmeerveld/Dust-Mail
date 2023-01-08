use std::time::Duration;

#[derive(Eq, PartialEq, PartialOrd, Ord)]
pub enum Capability {
    Top,
    User,
    Sasl(Vec<String>),
    RespCodes,
    LoginDelay(Duration),
    Pipelining,
    Expire(Option<Duration>),
    Uidl,
    Implementation(String),
}

pub type Capabilities = Vec<Option<Capability>>;

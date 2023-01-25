use serde::Serialize;

#[derive(Serialize)]
pub enum Flag {
    Read,
    Deleted,
    Answered,
    Flagged,
    Draft,
    Custom(Option<String>),
}

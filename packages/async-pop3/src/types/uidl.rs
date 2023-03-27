pub type UniqueID = (u32, String);

pub enum UniqueIDResponse {
    UniqueID(UniqueID),
    UniqueIDList(Vec<UniqueID>),
}

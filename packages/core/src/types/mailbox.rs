pub struct MailBox {
    pub unseen_count: Option<u32>,
    pub message_count: Option<u32>,
    pub delimiter: Option<String>,
    pub id: String,
    pub name: String,
}

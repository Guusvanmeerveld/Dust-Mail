pub struct Address {
    name: Option<String>,
    address: Option<String>,
}

impl Address {
    pub fn new(name: Option<String>, address: Option<String>) -> Self {
        Self { name, address }
    }

    pub fn name(&self) -> &Option<String> {
        &self.name
    }

    pub fn address(&self) -> &Option<String> {
        &self.address
    }

    pub fn full(&self) -> Option<String> {
        if self.address.is_some() && self.name.is_some() {
            Some(format!(
                "{} <{}>",
                self.name.as_ref().unwrap(),
                self.address.as_ref().unwrap()
            ))
        } else {
            None
        }
    }
}

pub struct Preview {
    pub from: Vec<Address>,
    pub id: String,
    pub sent: Option<i64>,
    pub subject: Option<String>,
}

pub struct Content {
    pub text: Option<String>,
    pub html: Option<String>,
}

pub struct Message {
    pub from: Vec<Address>,
    pub to: Vec<Address>,
    pub cc: Vec<Address>,
    pub bcc: Vec<Address>,
    pub id: String,
    pub sent: Option<i64>,
    pub subject: Option<String>,
    pub content: Content,
}

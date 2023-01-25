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
    from: Vec<Address>,
    id: String,
    sent: Option<i64>,
    subject: Option<String>,
}

impl Preview {
    pub fn new<S: Into<String>>(
        from: Vec<Address>,
        id: S,
        sent: Option<i64>,
        subject: Option<String>,
    ) -> Self {
        Self {
            from,
            id: id.into(),
            sent,
            subject,
        }
    }

    /// The sender(s) of the message.
    pub fn from(&self) -> &Vec<Address> {
        &self.from
    }

    /// A strictly unique id, used to fetch more info about the message.
    pub fn id(&self) -> &str {
        &self.id
    }

    /// Date in milliseconds since epoch
    pub fn sent(&self) -> Option<&i64> {
        self.sent.as_ref()
    }

    /// What the message is about.
    pub fn subject(&self) -> Option<&str> {
        match &self.subject {
            Some(subject) => Some(subject),
            None => None,
        }
    }
}

pub struct Content {
    text: Option<String>,
    html: Option<String>,
}

impl Content {
    pub fn new(text: Option<String>, html: Option<String>) -> Self {
        Self { text, html }
    }

    /// The message in pure text form.
    pub fn text(&self) -> Option<&str> {
        match &self.text {
            Some(text) => Some(text),
            None => None,
        }
    }

    /// The message as a html page.
    pub fn html(&self) -> Option<&str> {
        match &self.html {
            Some(html) => Some(html),
            None => None,
        }
    }
}

pub struct Message {
    from: Vec<Address>,
    to: Vec<Address>,
    cc: Vec<Address>,
    bcc: Vec<Address>,
    id: String,
    sent: Option<i64>,
    subject: Option<String>,
    content: Content,
}

impl Message {
    pub fn new<S: Into<String>>(
        from: Vec<Address>,
        to: Vec<Address>,
        cc: Vec<Address>,
        bcc: Vec<Address>,
        id: S,
        sent: Option<i64>,
        subject: Option<String>,
        content: Content,
    ) -> Self {
        Self {
            from,
            to,
            cc,
            bcc,
            id: id.into(),
            sent,
            subject,
            content,
        }
    }

    pub fn from(&self) -> &Vec<Address> {
        &self.from
    }

    pub fn to(&self) -> &Vec<Address> {
        &self.to
    }

    pub fn cc(&self) -> &Vec<Address> {
        &self.cc
    }

    pub fn bcc(&self) -> &Vec<Address> {
        &self.bcc
    }

    /// A strictly unique id, used to fetch more info about the message.
    pub fn id(&self) -> &str {
        &self.id
    }

    /// Date in milliseconds since epoch
    pub fn sent(&self) -> Option<&i64> {
        self.sent.as_ref()
    }

    /// What the message is about.
    pub fn subject(&self) -> Option<&str> {
        match &self.subject {
            Some(subject) => Some(subject),
            None => None,
        }
    }

    /// A struct containing info about the message content
    pub fn content(&self) -> &Content {
        &self.content
    }
}

use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct MailBox {
    counts: Option<Counts>,
    delimiter: Option<String>,
    children: Vec<MailBox>,
    selectable: bool,
    id: String,
    name: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct Counts {
    unseen: u32,
    total: u32,
}

impl Counts {
    pub fn new(unseen: u32, total: u32) -> Self {
        Counts { unseen, total }
    }

    /// The total amount of message that have not been read in this mailbox
    pub fn unseen(&self) -> &u32 {
        &self.unseen
    }

    /// The total amount of messages in this mailbox
    pub fn total(&self) -> &u32 {
        &self.total
    }
}

impl MailBox {
    pub fn new<S: Into<String>>(
        counts: Option<Counts>,
        delimiter: Option<String>,
        children: Vec<MailBox>,
        selectable: bool,
        id: S,
        name: S,
    ) -> Self {
        Self {
            counts,
            delimiter,
            children,
            selectable,
            id: id.into(),
            name: name.into(),
        }
    }

    /// A struct containing some info about the message counts in this mailbox.
    pub fn counts(&self) -> Option<&Counts> {
        self.counts.as_ref()
    }

    /// Whether the mailbox contains messages and can be selected.
    pub fn selectable(&self) -> &bool {
        &self.selectable
    }

    /// The name delimiter in this mailbox that indicates the hierachy in the id.
    pub fn delimiter(&self) -> Option<&str> {
        match &self.delimiter {
            Some(delimiter) => Some(delimiter),
            None => None,
        }
    }

    pub fn children(&self) -> &Vec<MailBox> {
        &self.children
    }

    pub fn children_mut(&mut self) -> &mut Vec<MailBox> {
        &mut self.children
    }

    /// A unique id for this mailbox.
    pub fn id(&self) -> &str {
        &self.id
    }

    /// The mailbox name.
    pub fn name(&self) -> &str {
        &self.name
    }
}

impl Default for Counts {
    fn default() -> Self {
        Self {
            total: 0,
            unseen: 0,
        }
    }
}

impl Default for MailBox {
    fn default() -> Self {
        Self {
            children: Vec::new(),
            counts: Some(Counts::default()),
            delimiter: None,
            id: String::new(),
            name: String::new(),
            selectable: true,
        }
    }
}

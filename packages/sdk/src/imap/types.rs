use std::collections::HashMap;

use crate::types::{Counts, MailBox};

#[derive(Debug)]
/// A struct useful for building a folder tree structure out of a flat mailbox array.
pub struct MailBoxTree {
    counts: Option<Counts>,
    delimiter: Option<String>,
    children: HashMap<String, MailBoxTree>,
    selectable: bool,
    id: String,
    name: String,
}

impl MailBoxTree {
    pub fn children_mut(&mut self) -> &mut HashMap<String, MailBoxTree> {
        &mut self.children
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    /// Convert this mailbox tree to a normal mailbox struct.
    pub fn to_mailbox(self) -> MailBox {
        let children = self
            .children
            .into_iter()
            .map(|(_, value)| value.to_mailbox())
            .collect();

        MailBox::new(
            None,
            self.delimiter,
            children,
            self.selectable,
            self.id,
            self.name,
        )
    }

    pub fn new<S: Into<String>>(
        counts: Option<Counts>,
        delimiter: Option<String>,
        children: HashMap<String, MailBoxTree>,
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
}

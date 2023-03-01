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

impl Into<MailBox> for MailBoxTree {
    fn into(self) -> MailBox {
        let children: Vec<MailBox> = self
            .children
            .into_iter()
            .map(|(_, value)| value.into())
            .collect();

        MailBox::new(
            self.counts,
            self.delimiter,
            children,
            self.selectable,
            self.id,
            self.name,
        )
    }
}

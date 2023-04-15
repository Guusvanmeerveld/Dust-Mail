use std::collections::HashMap;

use serde::Serialize;

#[cfg(feature = "imap")]
use async_imap::types::{
    Mailbox as ImapCounts, Name as ImapMailBox, NameAttribute as ImapBoxAttribute,
};

const DEFAULT_DELIMITER: &str = ".";

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct MailBox {
    counts: Option<Counts>,
    delimiter: Option<String>,
    children: Vec<MailBox>,
    selectable: bool,
    id: String,
    name: String,
}

#[derive(Debug, Default, Clone, Serialize, PartialEq, Eq)]
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

    #[cfg(feature = "imap")]
    /// Create a counts struct from a given imap mailbox struct and update the local attribute.
    pub fn create_counts(&mut self, imap_counts: ImapCounts) {
        let counts = Counts::new(imap_counts.unseen.unwrap_or(0), imap_counts.exists);

        self.counts = Some(counts);
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

#[cfg(feature = "imap")]
impl From<ImapMailBox> for MailBox {
    fn from(imap_mailbox: ImapMailBox) -> Self {
        // Whether the inbox is selectable
        let selectable = !imap_mailbox
            .attributes()
            .contains(&ImapBoxAttribute::NoSelect);

        // Create an owned string if the delimiter is specified
        let delimiter = imap_mailbox
            .delimiter()
            .map(|delimiter| delimiter.to_string());

        let id = imap_mailbox.name().to_string();

        // Split the id on the delimiter (using the default delimiter if it is not specified) and grab the last item
        // Example: 'INBOX.test.spam' becomes 'spam' if the delimiter is '.'
        let name = id
            .split(
                delimiter
                    .as_ref()
                    .unwrap_or(&String::from(DEFAULT_DELIMITER)),
            )
            .last()
            .unwrap_or("Unknown")
            .to_string();

        Self {
            delimiter,
            id,
            selectable,
            name,
            counts: None,
            children: vec![],
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

/// A struct representing a list of all of the mailboxes in a user's account.
pub struct MailBoxList {
    list: Vec<MailBox>,
}

impl MailBoxList {
    pub fn new(list: Vec<MailBox>) -> Self {
        // We must ensure that we have a tree like structure to make sure that our get_box function will work.
        let folder_tree = Self::build_folder_tree(list);

        Self { list: folder_tree }
    }

    /// This is a function that takes an array of mailboxes (a planar graph) and builds it into a folder tree of mailboxes.
    /// In the case that there is a mailbox present that has children, the children must also be present in the given array of mailboxes.
    fn build_folder_tree(planar_graph: Vec<MailBox>) -> Vec<MailBox> {
        let mut folders: HashMap<String, MailBoxNode> = HashMap::new();

        for folder in planar_graph.iter() {
            match folder.delimiter() {
                Some(delimiter) => {
                    let parts: Vec<_> = folder.name().split(delimiter).collect();

                    let mut current: Option<&mut MailBoxNode> = None;

                    for part in parts {
                        let id = match current.as_ref() {
                            Some(current) => format!("{}{}{}", current.id(), delimiter, part),
                            None => String::from(part),
                        };

                        if let Some(current_box) =
                            planar_graph.iter().find(|mailbox| mailbox.name() == &id)
                        {
                            let children = match current {
                                Some(current) => current.children_mut(),
                                None => &mut folders,
                            };

                            current = Some(
                                children
                                    .entry(String::from(part))
                                    .or_insert(MailBoxNode::from(current_box.clone())),
                            );
                        }
                    }
                }
                None => {
                    folders.insert(folder.id().to_string(), MailBoxNode::from(folder.clone()));
                }
            }
        }

        folders.into_iter().map(|(_, value)| value.into()).collect()
    }

    pub fn to_vec(self) -> Vec<MailBox> {
        self.list
    }

    pub fn get_vec(&self) -> &Vec<MailBox> {
        &self.list
    }

    pub fn get_box<S: AsRef<str>>(&self, box_id: S) -> Option<&MailBox> {
        Self::find_box_in_list(&self.list, box_id)
    }

    /// Finds a mailbox with a given id in a tree-like array list using breadth-first search
    fn find_box_in_list<'a, S: AsRef<str>>(
        list: &'a Vec<MailBox>,
        box_id: S,
    ) -> Option<&'a MailBox> {
        if list.len() < 1 {
            return None;
        };

        let found = list.iter().find(|mailbox| mailbox.id() == box_id.as_ref());

        if found.is_some() {
            found
        } else {
            list.iter()
                .filter_map(|mailbox| Self::find_box_in_list(mailbox.children(), box_id.as_ref()))
                .find(|mailbox| mailbox.id() == box_id.as_ref())
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::types::MailBox;

    use super::MailBoxList;

    #[test]
    fn find_box() {
        let delimiter = Some(String::from("."));

        let box1 = MailBox::new(None, delimiter.clone(), vec![], true, "box1", "box1");

        let box3 = MailBox::new(None, delimiter.clone(), vec![], true, "box2.box1", "box3");

        let box4 = MailBox::new(None, delimiter.clone(), vec![], true, "box2.box2", "box4");

        let box2 = MailBox::new(
            None,
            delimiter.clone(),
            vec![box3.clone(), box4.clone()],
            true,
            "box2",
            "box2",
        );

        let mock_boxes = vec![box1.clone(), box2.clone()];

        assert_eq!(
            MailBoxList::find_box_in_list(&mock_boxes, "box1").unwrap(),
            &box1
        );
        assert_eq!(
            MailBoxList::find_box_in_list(&mock_boxes, "box2").unwrap(),
            &box2
        );
        assert_eq!(
            MailBoxList::find_box_in_list(&mock_boxes, "box2.box1").unwrap(),
            &box3
        );
        assert_eq!(
            MailBoxList::find_box_in_list(&mock_boxes, "box2.box2").unwrap(),
            &box4
        );

        assert_eq!(MailBoxList::find_box_in_list(&mock_boxes, "box3"), None);
    }
}

#[derive(Debug)]
/// A struct useful for building a folder tree structure out of a flat mailbox array.
pub struct MailBoxNode {
    counts: Option<Counts>,
    delimiter: Option<String>,
    children: HashMap<String, MailBoxNode>,
    selectable: bool,
    id: String,
    name: String,
}

impl MailBoxNode {
    pub fn children_mut(&mut self) -> &mut HashMap<String, MailBoxNode> {
        &mut self.children
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    // pub fn new<S: Into<String>, T: Into<String>>(
    //     counts: Option<Counts>,
    //     delimiter: Option<String>,
    //     children: HashMap<String, MailBoxNode>,
    //     selectable: bool,
    //     id: S,
    //     name: T,
    // ) -> Self {
    //     Self {
    //         counts,
    //         delimiter,
    //         children,
    //         selectable,
    //         id: id.into(),
    //         name: name.into(),
    //     }
    // }
}

impl From<MailBox> for MailBoxNode {
    /// Go from a planar mailbox (so no children) to a mailbox tree
    fn from(mailbox: MailBox) -> Self {
        Self {
            children: HashMap::new(),
            counts: mailbox.counts,
            delimiter: mailbox.delimiter,
            id: mailbox.id,
            name: mailbox.name,
            selectable: mailbox.selectable,
        }
    }
}

impl Into<MailBox> for MailBoxNode {
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

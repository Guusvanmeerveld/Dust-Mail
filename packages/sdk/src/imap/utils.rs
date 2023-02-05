use crate::types::MailBox;

/// Finds a mailbox with a given id in a tree-like array list using breadth-first search
pub fn find_box_in_list<'a>(list: &'a Vec<MailBox>, box_id: &str) -> Option<&'a MailBox> {
    if list.len() < 1 {
        return None;
    };

    let found = list.iter().find(|mailbox| mailbox.id() == box_id);

    if found.is_some() {
        found
    } else {
        list.iter()
            .filter_map(|mailbox| find_box_in_list(mailbox.children(), box_id))
            .find(|mailbox| mailbox.id() == box_id)
    }
}

#[cfg(test)]
mod tests {
    use crate::types::MailBox;

    use super::find_box_in_list;

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

        assert_eq!(find_box_in_list(&mock_boxes, "box1").unwrap(), &box1);
        assert_eq!(find_box_in_list(&mock_boxes, "box2").unwrap(), &box2);
        assert_eq!(find_box_in_list(&mock_boxes, "box2.box1").unwrap(), &box3);
        assert_eq!(find_box_in_list(&mock_boxes, "box2.box2").unwrap(), &box4);

        assert_eq!(find_box_in_list(&mock_boxes, "box3"), None);
    }
}

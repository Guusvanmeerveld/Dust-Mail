use std::collections::HashMap;

#[test]
pub fn from_addr() {
    let mut addresses = HashMap::new();

    addresses.insert("guusvanmeerveld@outlook.com", "outlook.com");
    addresses.insert("guusvanmeerveld@gmail.com", "googlemail.com");
    addresses.insert("contact@guusvanmeerveld.dev", "guusvanmeerveld.dev");

    for (addr, id) in addresses.iter() {
        let config = super::from_addr(addr).unwrap().unwrap();

        assert_eq!(id, &config.email_provider().id());
    }
}

use crate::types::Result;

use keyring::Entry;

const APPLICATION_NAME: &str = "Dust-Mail";

fn build_entry_from_identifier<T: AsRef<str>>(identifier: T) -> Result<Entry> {
    let username = whoami::username();

    let name = format!("{}:{}", APPLICATION_NAME, identifier.as_ref());

    let entry = Entry::new(&name, &username)?;

    Ok(entry)
}

pub fn get<T: AsRef<str>>(identifier: T) -> Result<String> {
    let entry = build_entry_from_identifier(identifier)?;

    let password = entry.get_password()?;

    Ok(password)
}

pub fn set<T: AsRef<str>, S: AsRef<str>>(identifier: T, value: S) -> Result<()> {
    let entry = build_entry_from_identifier(identifier)?;

    entry.set_password(value.as_ref())?;

    Ok(())
}

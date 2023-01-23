use http::Client;
use types::Config;

mod http;
mod parse;
pub mod types;

const AT_SYMBOL: char = '@';

pub fn from_addr(email_address: &str) -> types::Result<Config> {
    if !email_address.contains(AT_SYMBOL) {
        return Err(types::Error::new(
            types::ErrorKind::BadInput,
            "An email address must have an '@' symbol in it",
        ));
    };

    let mut split = email_address.split(AT_SYMBOL);

    // Skip the prefix
    split.next();

    let domain = match split.next() {
        Some(domain) => domain,
        None => {
            return Err(types::Error::new(
                types::ErrorKind::BadInput,
                "An email address must specify a domain after the '@' symbol",
            ))
        }
    };

    let client = Client::new();

    let urls = Vec::from([
        // Try connect to connect with the users mail server directly
        format!(
            "http://autoconfig.{}/mail/config-v1.1.xml?emailaddress={}",
            domain, email_address
        ),
        // The fallback url
        format!(
            "http://{}/.well-known/autoconfig/mail/config-v1.1.xml",
            domain
        ),
        // If the previous two methods did not work then the email server provider has not setup Thunderbird autoconfig, so we ask Mozilla for their config.
        format!("https://autoconfig.thunderbird.net/v1.1/{}", domain),
    ]);

    let config_unparsed: Option<String> = request_urls(&client, urls);

    match config_unparsed {
        Some(config_unparsed) => {
            let config = parse::from_str(&config_unparsed)?;

            Ok(config)
        }
        None => Err(types::Error::new(
            types::ErrorKind::NotFound,
            format!("Could not find any config related to '{}'", email_address),
        )),
    }
}

fn request_urls(client: &Client, urls: Vec<String>) -> Option<String> {
    for url in urls {
        match client.get(url) {
            Ok(response) => return Some(response),
            Err(_) => {}
        }
    }

    return None;
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    #[test]
    fn from_addr() {
        let mut addresses = HashMap::new();

        addresses.insert("guusvanmeerveld@outlook.com", "outlook.com");
        addresses.insert("guusvanmeerveld@gmail.com", "googlemail.com");
        addresses.insert("guusvanmeerveld@gmail.com", "googlemail.com");

        for (addr, id) in addresses.iter() {
            let config = super::from_addr(addr).unwrap();

            assert_eq!(id, &config.email_provider.id);
        }
    }
}

use http::Client;
use regex::Regex;
use types::config::Config;

mod http;
mod parse;
pub mod types;

const AT_SYMBOL: char = '@';

const EMAIL_REGEX: &str =
    r"^([a-z0-9_+]([a-z0-9_+.]*[a-z0-9_+])?)@([a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6})";

pub fn from_domain(domain: &str) -> types::Result<Option<Config>> {
    let client = Client::new();

    let urls = vec![
        // Try connect to connect with the users mail server directly
        format!("http://autoconfig.{}/mail/config-v1.1.xml", domain),
        // The fallback url
        format!(
            "http://{}/.well-known/autoconfig/mail/config-v1.1.xml",
            domain
        ),
        // If the previous two methods did not work then the email server provider has not setup Thunderbird autoconfig, so we ask Mozilla for their config.
        format!("https://autoconfig.thunderbird.net/v1.1/{}", domain),
    ];

    let config_unparsed: Option<String> = request_urls(&client, urls);

    match config_unparsed {
        Some(config_unparsed) => {
            let config = parse::from_str(&config_unparsed)?;

            Ok(Some(config))
        }
        None => Ok(None),
    }
}

pub fn from_addr(email_address: &str) -> types::Result<Option<Config>> {
    let email_regex = Regex::new(EMAIL_REGEX).unwrap();

    if !email_regex.is_match(email_address) {
        return Err(types::Error::new(
            types::ErrorKind::BadInput,
            "Given email address is invalid",
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

    from_domain(domain)
}

fn request_urls(client: &Client, urls: Vec<String>) -> Option<String> {
    // Fetch every given url
    for url in urls {
        match client.get(url) {
            Ok(response) => return Some(response),
            Err(_) => {}
        }
    }

    // Return nothing if all of the requests failed
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
        addresses.insert("contact@guusvanmeerveld.dev", "guusvanmeerveld.dev");

        for (addr, id) in addresses.iter() {
            let config = super::from_addr(addr).unwrap().unwrap();

            assert_eq!(id, &config.email_provider().id());
        }
    }
}

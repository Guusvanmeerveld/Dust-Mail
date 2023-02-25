use http::Client;
use types::config::Config;

mod http;
mod parse;
pub mod types;
mod utils;

pub use utils::validate_email;

const AT_SYMBOL: char = '@';

/// Given an email providers domain, try to connect to autoconfig servers for that provider and return the config.
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

    let config_unparsed: Option<String> = client.request_urls(urls);

    match config_unparsed {
        Some(config_unparsed) => {
            let config = parse::from_str(&config_unparsed)?;

            Ok(Some(config))
        }
        None => Ok(None),
    }
}

/// Given an email address, try to connect to the email providers autoconfig servers and return the config that was found.
pub fn from_addr(email_address: &str) -> types::Result<Option<Config>> {
    if !utils::validate_email(email_address) {
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

#[cfg(test)]
mod test;

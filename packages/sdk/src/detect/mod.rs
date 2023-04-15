use std::collections::HashMap;

use dust_mail_utils::validate_email;
use futures::future::join_all;

use crate::types::{ConnectionSecurity, Error, ErrorKind, Result};

mod parse;
mod service;
mod types;

#[cfg(feature = "autoconfig")]
use parse::AutoConfigParser;

use types::{AuthenticationType, ConfigType, ServerConfig, ServerConfigType};

pub use types::Config;

use self::{service::detect_server_config, types::Socket};

const AT_SYMBOL: &str = "@";

/// Given an array of sockets (domain name, port and connection security) check which of the sockets have a server of a given mail server type running on them.
async fn check_sockets(sockets: Vec<Socket>) -> Result<HashMap<ServerConfigType, Socket>> {
    let mut config_types = HashMap::new();

    // First, we create an array of tasks that we then later run all at the same time.
    let mut tasks = Vec::new();

    for socket in sockets.iter() {
        tasks.push(detect_server_config(socket))
    }

    let results = join_all(tasks).await;

    for (result, socket) in results.into_iter().zip(sockets.into_iter()) {
        if let Some(config_type) = result? {
            config_types.entry(config_type).or_insert(socket);
        }
    }

    Ok(config_types)
}

/// Automatically detect an email providers config for a given email address
pub async fn from_email(email_address: &str) -> Result<Config> {
    if !validate_email(email_address) {
        return Err(Error::new(
            ErrorKind::ParseAddress,
            "Given email address is invalid",
        ));
    };

    let mut config: Option<Config> = None;

    let mut split = email_address.split(AT_SYMBOL);

    // Skip the prefix
    split.next();

    let domain = split.next().unwrap().to_string();

    #[cfg(feature = "autoconfig")]
    {
        let detected_autoconfig = autoconfig::from_domain(&domain).await?;

        match detected_autoconfig {
            Some(detected_autoconfig) => {
                config = Some(AutoConfigParser::parse(detected_autoconfig)?)
            }
            None => {}
        }
    }

    // If we didn't find anything using autoconfig, we try the subdomains.
    if config.is_none() {
        let mail_domain = format!("mail.{}", domain);

        let mut incoming_configs: Vec<ServerConfig> = Vec::new();
        let mut outgoing_configs: Vec<ServerConfig> = Vec::new();

        let mut sockets_to_check: Vec<Socket> = Vec::new();

        #[cfg(feature = "imap")]
        {
            let secure_imap_port: u16 = 993;
            let imap_port: u16 = 143;

            let imap_domain = format!("imap.{}", domain);

            let tuples = vec![
                (&mail_domain, secure_imap_port, ConnectionSecurity::Tls),
                (&imap_domain, secure_imap_port, ConnectionSecurity::Tls),
                (&mail_domain, imap_port, ConnectionSecurity::Plain),
                (&imap_domain, imap_port, ConnectionSecurity::Plain),
            ];

            for tuple in tuples {
                let socket = Socket::from_tuple(tuple);

                sockets_to_check.push(socket);
            }
        }

        #[cfg(feature = "pop")]
        {
            let secure_pop_port: u16 = 995;
            let pop_port: u16 = 110;

            let pop_domain = format!("pop.{}", domain);

            let tuples = vec![
                (&mail_domain, secure_pop_port, ConnectionSecurity::Tls),
                (&pop_domain, secure_pop_port, ConnectionSecurity::Tls),
                (&mail_domain, pop_port, ConnectionSecurity::Plain),
                (&pop_domain, pop_port, ConnectionSecurity::Plain),
            ];

            for tuple in tuples {
                let socket = Socket::from_tuple(tuple);

                sockets_to_check.push(socket);
            }
        }

        #[cfg(feature = "smtp")]
        {
            let secure_smpt_port: u16 = 587;
            let smpt_port: u16 = 25;

            let smtp_domain = format!("smtp.{}", domain);

            let tuples = vec![
                (&mail_domain, secure_smpt_port, ConnectionSecurity::StartTls),
                (&smtp_domain, secure_smpt_port, ConnectionSecurity::StartTls),
                (&mail_domain, smpt_port, ConnectionSecurity::Plain),
                (&smtp_domain, smpt_port, ConnectionSecurity::Plain),
            ];

            for tuple in tuples {
                let socket = Socket::from_tuple(tuple);

                sockets_to_check.push(socket);
            }
        }

        let results = check_sockets(sockets_to_check).await?;

        for (config_type, socket) in results {
            let is_outgoing = config_type.is_outgoing();

            let config = socket.into_server_config(config_type);

            if is_outgoing {
                outgoing_configs.push(config);
            } else {
                incoming_configs.push(config);
            }
        }

        if incoming_configs.len() > 0 || outgoing_configs.len() > 0 {
            config = Some(Config::new(
                ConfigType::new_multiserver(incoming_configs, outgoing_configs),
                domain.as_str(),
                None,
                Some(domain.to_string()),
            ));
        }
    }

    match config {
        Some(config) => Ok(config),
        None => Err(Error::new(
            ErrorKind::ConfigNotFound,
            "Could not detect an email server config from the given email address",
        )),
    }
}

mod test {
    #[tokio::test]
    async fn from_email() {
        let email = "guusvanmeerveld@yahoo.com";

        let config = super::from_email(email).await.unwrap();

        println!("{}", config.to_json().unwrap());
    }
}

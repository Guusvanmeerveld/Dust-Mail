use std::io::{Read, Write};

use crate::{
    client::incoming::{IncomingClient, IncomingClientBuilder, IncomingSession},
    types::{ConnectionSecurity, IncomingClientType, Result},
};

use super::login::{LoginOptions, LoginType};

fn create_session_from_client<S: Write + Read + Send + 'static>(
    client: IncomingClient<S>,
    login_type: &LoginType,
) -> Result<Box<dyn IncomingSession + Send>> {
    match login_type {
        LoginType::PasswordBased(password_creds) => {
            client.login(password_creds.username(), password_creds.password())
        }
        LoginType::OAuthBased(oauth_creds) => client.oauth2_login(oauth_creds),
    }
}

/// Given some login options and a client type, create an incoming session.
///
/// This will automatically connect and login to the mail server specified in the login options using the credentials specified in the login options.
pub fn create_incoming_session(
    options: &LoginOptions,
    client_type: &IncomingClientType,
) -> Result<Box<dyn IncomingSession + Send>> {
    let mut builder = IncomingClientBuilder::new(client_type);

    builder
        .set_server(options.domain())
        .set_port(options.port().clone());

    match options.security() {
        ConnectionSecurity::Tls => {
            let client = builder.build()?;

            create_session_from_client(client, options.login_type())
        }
        ConnectionSecurity::Plain => {
            let client = builder.build_plain()?;

            create_session_from_client(client, options.login_type())
        }
        _ => {
            todo!()
        }
    }
}

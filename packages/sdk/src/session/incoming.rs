use crate::{
    client::incoming::{ClientConstructor as IncomingClientConstructor, Session},
    types::{ConnectOptions, ConnectionSecurity, LoginOptions, Result, IncomingClientType},
};

pub fn create_session(
    options: &LoginOptions,
    client_type: &IncomingClientType,
) -> Result<Box<dyn Session + Send>> {
    let client_options = ConnectOptions::new(options.domain(), options.port());

    match options.security() {
        ConnectionSecurity::Tls => {
            let client = IncomingClientConstructor::new(client_type, Some(client_options))?;

            client
                .login(options.username(), options.password())
        }
        ConnectionSecurity::Plain => {
            let client = IncomingClientConstructor::new_plain(client_type, Some(client_options))?;

            client
                .login(options.username(), options.password())
        }
        _ => {
            todo!()
        }
    }
}

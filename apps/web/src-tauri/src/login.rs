use crate::{
    parse::parse_sdk_error,
    types::{ClientType, LoginOptions, Result},
};

use sdk::{
    types::{ConnectionSecurity, LoginOptions as ClientLoginOptions},
    IncomingClientConstructor,
};

pub fn try_login(option: &LoginOptions) -> Result<()> {
    match option.client_type() {
        ClientType::Incoming(client_type) => {
            let options = ClientLoginOptions::new(option.domain(), option.port());

            let mut session = match option.security() {
                ConnectionSecurity::Tls => {
                    let client = IncomingClientConstructor::new(client_type, Some(options))
                        .map_err(parse_sdk_error)?;

                    client
                        .login(option.username(), option.password())
                        .map_err(parse_sdk_error)?
                }
                ConnectionSecurity::Plain => {
                    let client = IncomingClientConstructor::new_plain(client_type, Some(options))
                        .map_err(parse_sdk_error)?;

                    client
                        .login(option.username(), option.password())
                        .map_err(parse_sdk_error)?
                }
                _ => {
                    todo!()
                }
            };

            session.logout().map_err(parse_sdk_error)?;
        }
        _ => {}
    };

    Ok(())
}

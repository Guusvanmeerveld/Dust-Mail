use sdk::session::{FullLoginOptions, LoginType};

use crate::{hash::sha256_hex, types::Result};

pub struct Identifier {
    id: String,
}

impl Identifier {
    /// Hash the currently stored identifier
    pub fn hash(&mut self) -> Result<()> {
        self.id = sha256_hex(self.id.as_bytes())?;

        Ok(())
    }
}

impl Into<String> for Identifier {
    fn into(self) -> String {
        self.id
    }
}

impl From<&FullLoginOptions> for Identifier {
    fn from(login_options: &FullLoginOptions) -> Self {
        // TODO: Outgoing support
        let incoming = login_options.incoming_options();

        let (username, password) = match incoming.login_type() {
            LoginType::PasswordBased(creds) => (creds.username(), creds.password()),
            LoginType::OAuthBased(creds) => (creds.username(), creds.access_token()),
        };

        // A string that is unique to these login options.
        let credentials_string = format!(
            "{}:{}@{}:{}",
            username,
            password,
            incoming.domain(),
            incoming.port()
        );

        Self {
            id: credentials_string,
        }
    }
}

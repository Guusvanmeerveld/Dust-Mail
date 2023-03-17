use serde::{Deserialize, Serialize};

use crate::types::{ConnectionSecurity, IncomingClientType, OAuthCredentials};

#[derive(Deserialize, Serialize, Clone)]
pub struct PasswordCredentials {
    username: String,
    password: String,
}

impl PasswordCredentials {
    pub fn password(&self) -> &str {
        &self.password
    }

    pub fn username(&self) -> &str {
        &self.username
    }

    pub fn new<S: Into<String>>(username: S, password: S) -> Self {
        Self {
            password: password.into(),
            username: username.into(),
        }
    }
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum LoginType {
    PasswordBased(PasswordCredentials),
    OAuthBased(OAuthCredentials),
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
/// A struct that specifies all of the need options and credentials to login to a mail server.
pub struct LoginOptions {
    login_type: LoginType,
    domain: String,
    port: u16,
    security: ConnectionSecurity,
}

impl LoginOptions {
    pub fn domain(&self) -> &str {
        &self.domain
    }

    pub fn set_domain<S: Into<String>>(&mut self, domain: S) {
        self.domain = domain.into();
    }

    pub fn port(&self) -> &u16 {
        &self.port
    }

    pub fn set_port<S: Into<u16>>(&mut self, port: u16) {
        self.port = port.into();
    }

    pub fn security(&self) -> &ConnectionSecurity {
        &self.security
    }

    pub fn login_type(&self) -> &LoginType {
        &self.login_type
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
/// The bigger brother of `LoginOptions`.
///
/// Contains all of the information needed to login to an incoming and outgoing mail server and specifies what protocol is need to do so.
pub struct FullLoginOptions {
    incoming: LoginOptions,
    incoming_type: IncomingClientType,
}

impl FullLoginOptions {
    pub fn incoming_options(&self) -> &LoginOptions {
        &self.incoming
    }

    pub fn incoming_type(&self) -> &IncomingClientType {
        &self.incoming_type
    }
}

pub struct FullLoginOptionsBuilder {
    incoming_type: IncomingClientType,
    domain: Option<String>,
    port: Option<u16>,
    security: Option<ConnectionSecurity>,
    username: Option<String>,
    password: Option<String>,
    access_token: Option<String>,
}

impl FullLoginOptionsBuilder {
    pub fn new(incoming_type: &IncomingClientType) -> Self {
        Self {
            incoming_type: incoming_type.clone(),
            access_token: None,
            domain: None,
            password: None,
            port: None,
            security: None,
            username: None,
        }
    }

    pub fn domain<S: Into<String>>(&mut self, domain: S) -> &mut Self {
        self.domain = Some(domain.into());

        self
    }

    pub fn port(&mut self, port: u16) -> &mut Self {
        self.port = Some(port);

        self
    }

    pub fn security(&mut self, security: ConnectionSecurity) -> &mut Self {
        self.security = Some(security);

        self
    }

    pub fn username<S: Into<String>>(&mut self, username: S) -> &mut Self {
        self.username = Some(username.into());

        self
    }

    pub fn password<S: Into<String>>(&mut self, password: S) -> &mut Self {
        self.password = Some(password.into());

        self
    }

    pub fn access_token<S: Into<String>>(&mut self, access_token: S) -> &mut Self {
        self.access_token = Some(access_token.into());

        self
    }

    pub fn build(self) -> Option<FullLoginOptions> {
        let domain = self.domain?;
        let port = self.port?;
        let security = self.security?;
        let username = self.username?;

        let password = self.password;
        let access_token = self.access_token;

        let mut login_type: Option<LoginType> = None;

        if password.is_some() {
            let password_creds = PasswordCredentials::new(username, password.unwrap());

            login_type = Some(LoginType::PasswordBased(password_creds));
        } else if access_token.is_some() {
            let oauth_creds = OAuthCredentials::new(username, access_token.unwrap());

            login_type = Some(LoginType::OAuthBased(oauth_creds));
        }

        let login_options = LoginOptions {
            login_type: login_type?,
            domain,
            port,
            security,
        };

        Some(FullLoginOptions {
            incoming: login_options,
            incoming_type: self.incoming_type,
        })
    }
}

impl Into<String> for FullLoginOptions {
    /// Creates an identifiable string from the credentials, excluding the password.
    fn into(self) -> String {
        let incoming = self.incoming_options();

        let username = match incoming.login_type() {
            LoginType::OAuthBased(oauth_creds) => oauth_creds.username(),
            LoginType::PasswordBased(password_creds) => password_creds.username(),
        };

        format!("{}@{}:{}", username, incoming.domain(), incoming.port())
    }
}

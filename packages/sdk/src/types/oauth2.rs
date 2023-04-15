use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OAuthCredentials {
    username: String,
    access_token: String,
}

impl OAuthCredentials {
    pub fn new<S: Into<String>>(username: S, access_token: S) -> Self {
        Self {
            access_token: access_token.into(),
            username: username.into(),
        }
    }

    pub fn username(&self) -> &str {
        &self.username
    }

    pub fn access_token(&self) -> &str {
        &self.access_token
    }
}

#[cfg(feature = "imap")]
impl async_imap::Authenticator for OAuthCredentials {
    type Response = String;

    fn process(&mut self, _: &[u8]) -> Self::Response {
        format!(
            "user={}\x01auth=Bearer {}\x01\x01",
            self.username, self.access_token
        )
    }
}

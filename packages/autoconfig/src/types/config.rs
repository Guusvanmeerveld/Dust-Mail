use serde::Deserialize;

#[derive(Debug, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub version: String,
    pub email_provider: EmailProvider,
}

#[derive(Debug, Deserialize, PartialEq)]
pub struct EmailProvider {
    pub id: String,
    #[serde(rename = "$value")]
    pub properties: Vec<EmailProviderProperty>,
}

#[derive(Debug, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum EmailProviderProperty {
    Domain(String),
    DisplayName(String),
    DisplayShortName(String),
    IncomingServer(Server),
    OutgoingServer(Server),
    Documentation(Documentation),
}

#[derive(Debug, Deserialize, PartialEq)]
pub struct Server {
    #[serde(rename = "type")]
    pub server_type: ServerType,
    pub hostname: String,
    pub port: u16,
    #[serde(rename = "socketType")]
    pub socket_type: SocketType,
    pub username: String,
    pub password: Option<String>,
}

#[derive(Debug, Deserialize, PartialEq)]
pub enum SocketType {
    #[serde(rename = "plain")]
    Plain,
    #[serde(rename = "STARTTLS")]
    Starttls,
    #[serde(rename = "SSL")]
    Tls,
}

#[derive(Debug, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ServerType {
    Exchange,
    Imap,
    Pop3,
    Smtp,
}

#[derive(Debug, Deserialize, PartialEq)]
pub enum AuthenticationType {
    #[serde(rename = "password-cleartext")]
    PasswordCleartext,
    #[serde(rename = "password-encrypted")]
    PasswordEncrypted,
    #[serde(rename = "NTLM")]
    Ntlm,
    #[serde(rename = "GSAPI")]
    GsApi,
    #[serde(rename = "client-IP-address")]
    ClientIPAddress,
    #[serde(rename = "TLS-client-cert")]
    TlsClientCert,
    OAuth2,
    #[serde(rename = "None")]
    None,
}

#[derive(Debug, Deserialize, PartialEq)]
pub struct Documentation {
    pub url: String,
    #[serde(rename = "$value")]
    pub properties: Vec<DocumentationDescription>,
}

#[derive(Debug, Deserialize, PartialEq)]
pub struct DocumentationDescription {
    pub lang: Option<String>,
    #[serde(rename = "$value")]
    pub description: String,
}

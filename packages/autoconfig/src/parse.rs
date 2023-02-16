use crate::types::{self, config::Config};

use serde_xml_rs;

pub fn from_str(string: &str) -> types::Result<Config> {
    let config: Config = serde_xml_rs::from_str(string)
        .map_err(|e| types::Error::new(types::ErrorKind::Parse, e.to_string()))?;

    Ok(config)
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_parser() {
        // From: https://wiki.mozilla.org/Thunderbird:Autoconfiguration:ConfigFileFormat
        let mock_config = r#"
            <?xml version="1.0"?>
            <clientConfig version="1.1">
                <emailProvider id="example.com">
                <domain>example.com</domain>
                <domain>example.net</domain>

                <displayName>Google Mail</displayName>
                <displayShortName>GMail</displayShortName>

                <incomingServer type="pop3">
                    <hostname>pop.example.com</hostname>
                    <port>995</port>
                    <socketType>SSL</socketType>
                    <username>%EMAILLOCALPART%</username>
                    <authentication>password-cleartext</authentication>
                    <pop3>
                        
                        <leaveMessagesOnServer>true</leaveMessagesOnServer>
                        <downloadOnBiff>true</downloadOnBiff>
                        <daysToLeaveMessagesOnServer>14</daysToLeaveMessagesOnServer>
                    
                        <checkInterval minutes="15"/>
                    </pop3>
                    
                </incomingServer>

                <outgoingServer type="smtp">
                    <hostname>smtp.googlemail.com</hostname>
                    <port>587</port>
                    <socketType>STARTTLS</socketType>
                    <username>%EMAILLOCALPART%</username>
                    <authentication>password-cleartext</authentication>
                      
                    <useGlobalPreferredServer>true</useGlobalPreferredServer>
                    <password>optional: the user's password</password>
                </outgoingServer>

                <documentation url="http://www.example.com/help/mail/thunderbird">
                    <descr lang="en">Configure Thunderbird 2.0 for IMAP</descr>
                    <descr lang="de">Thunderbird 2.0 mit IMAP konfigurieren</descr>
                </documentation>

                </emailProvider>

            </clientConfig>
        "#;

        super::from_str(mock_config).unwrap();
    }
}

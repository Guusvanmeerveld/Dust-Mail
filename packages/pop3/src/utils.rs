use std::fmt::Display;

use crate::types;

const SPACE: u8 = b' ';

pub fn create_command<T: Display>(
    name: &str,
    arguments: &Option<Vec<Option<T>>>,
) -> types::Result<String> {
    let mut bytes = Vec::from(name.as_bytes());

    match arguments {
        Some(arguments) => {
            for arg in arguments {
                match arg {
                    Some(arg) => {
                        bytes.push(SPACE);

                        for character in arg.to_string().trim().replace(" ", "_").as_bytes() {
                            bytes.push(*character);
                        }
                    }
                    None => {}
                }
            }
        }
        None => {}
    }

    match String::from_utf8(bytes) {
        Ok(result) => Ok(result),
        Err(err) => Err(types::Error::new(
            types::ErrorKind::SendCommand,
            format!("Failed to convert command into string: {}", err),
        )),
    }
}

#[cfg(test)]
mod test {
    use super::create_command;

    #[test]
    fn test_create_command() {
        let to_parse = vec![
            ("DELE", Some(vec![Some("1")])),
            ("DELE", None),
            (
                "UIDL",
                Some(vec![Some("10\n\r"), Some("T T"), Some("    test")]),
            ),
        ];

        let to_match = vec!["DELE 1", "DELE", "UIDL 10 T_T test"];

        let result: Vec<String> = to_parse
            .iter()
            .map(|(name, arguments)| create_command(name, arguments).unwrap())
            .collect();

        assert_eq!(result, to_match)
    }
}

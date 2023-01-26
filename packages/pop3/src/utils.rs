use std::fmt::Display;

use crate::types;

const SPACE: u8 = b' ';

pub fn create_command<T: Display>(
    name: &str,
    arguments: Option<Vec<Option<T>>>,
) -> types::Result<String> {
    let mut bytes = Vec::from(name.as_bytes());

    match arguments {
        Some(arguments) => {
            for arg in arguments {
                match arg {
                    Some(arg) => {
                        bytes.push(SPACE);

                        for character in arg.to_string().as_bytes() {
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

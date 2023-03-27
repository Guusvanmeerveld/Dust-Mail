use crate::types;

const SPACE: char = ' ';

pub fn create_command<S: Into<String>, T: AsRef<str>>(
    name: S,
    arguments: &Vec<T>,
) -> types::Result<String> {
    let mut command: String = name.into();

    for arg in arguments {
        command.push(SPACE);

        let arg_parsed = arg.as_ref().trim().replace(" ", "_");

        command.push_str(&arg_parsed);
    }

    Ok(command)
}

#[cfg(test)]
mod test {
    use super::create_command;

    #[test]
    fn test_create_command() {
        let to_parse = vec![
            ("DELE", vec!["1"]),
            ("DELE", Vec::new()),
            ("UIDL", vec!["10\n\r", "T T", "    test"]),
        ];

        let to_match = vec!["DELE 1", "DELE", "UIDL 10 T_T test"];

        let result: Vec<String> = to_parse
            .iter()
            .map(|(name, arguments)| create_command(name.to_string(), arguments).unwrap())
            .collect();

        assert_eq!(result, to_match)
    }
}

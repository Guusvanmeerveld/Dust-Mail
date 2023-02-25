use regex::Regex;

const EMAIL_REGEX: &str =
    r"^([a-z0-9_+]([a-z0-9_+.]*[a-z0-9_+])?)@([a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6})";

pub fn validate_email(unknown_str: &str) -> bool {
    let email_regex = Regex::new(EMAIL_REGEX).unwrap();

    email_regex.is_match(unknown_str)
}

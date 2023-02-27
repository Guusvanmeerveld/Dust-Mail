use crate::{
    constants,
    state::Config,
    types::{Error, ErrorKind, Result},
};
use directories::BaseDirs;
use std::{
    env,
    fs::{create_dir_all, read_to_string, write},
    path::{Path, PathBuf},
};

pub fn create_mail_parse_error() -> Error {
    Error::new(ErrorKind::Parse, "Failed to parse email address")
}

pub fn get_domain_from_email<'a>(email: &'a str) -> Result<&'a str> {
    let mut email_split = email.split('@');

    match email_split.next() {
        Some(_) => {}
        None => return Err(create_mail_parse_error()),
    };

    match email_split.next() {
        Some(domain) => Ok(domain),
        None => Err(create_mail_parse_error()),
    }
}

fn config_file() -> PathBuf {
    let base_dirs = BaseDirs::new().expect("Failed to retrieve home directory from os");

    let app_name = constants::APP_NAME.to_ascii_lowercase();

    base_dirs.config_dir().join(app_name)
}

fn config_location() -> PathBuf {
    let location = env::var("CONFIG_LOCATION")
        .map(|value| Path::new(&value).to_path_buf())
        .unwrap_or_else(|_| config_file());

    create_dir_all(&location).expect("Failed to create parent directories for config file");

    let file = location.join("config.toml");

    if !file.exists() {
        let default_config = Config::default();

        let config_string =
            toml::to_string(&default_config).expect("Failed to serialize default config");

        write(&file, &config_string).expect("Failed to create default config file");
    }

    file
}

pub fn read_config() -> Config {
    let config_location = config_location();

    let config_string = read_to_string(config_location).expect("Failed to read config file");

    let config: Config = toml::from_str(&config_string).expect("Failed to parse config");

    config
}

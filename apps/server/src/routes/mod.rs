mod detect;
mod login;

pub use detect::auto_detect_config as auto_detect_config_handler;
pub use login::login as login_handler;

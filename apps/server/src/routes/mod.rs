mod detect;
mod login;
mod logout;

pub use detect::auto_detect_config as auto_detect_config_handler;
pub use login::login as login_handler;
pub use logout::logout as logout_handler;

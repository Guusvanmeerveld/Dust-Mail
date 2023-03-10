mod detect;
mod login;
mod logout;
mod mail;
mod settings;
mod version;

pub use detect::auto_detect_config as auto_detect_config_handler;
pub use login::login as login_handler;
pub use logout::logout as logout_handler;
pub use settings::settings as settings_handler;
pub use version::version as version_handler;

pub use mail::*;

mod get;
mod list;
mod message;
mod messages;

pub use get::get_box as mail_get_box_handler;
pub use list::box_list as mail_box_list_handler;
pub use message::get_message as mail_box_message_handler;
pub use messages::get_messages as mail_box_messages_handler;

mod cache;
mod routes;
mod types;
mod utils;

#[macro_use]
extern crate rocket;

use rocket::serde::json::Json;
use types::{ErrResponse, ErrorKind};

#[catch(404)]
fn not_found() -> Json<ErrResponse> {
    ErrResponse::new(ErrorKind::NotFound, "Route could not be found")
}

#[catch(500)]
fn internal_error() -> Json<ErrResponse> {
    ErrResponse::new(ErrorKind::InternalError, "Internal server error")
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .register("/", catchers![not_found, internal_error])
        .manage(cache::ConfigCache::new())
        .mount(
            "/",
            routes![routes::auto_detect_config_handler, routes::login_handler,],
        )
}

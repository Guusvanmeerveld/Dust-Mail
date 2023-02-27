mod cache;
mod constants;
mod guards;
mod routes;
mod state;
mod types;
mod utils;

#[macro_use]
extern crate rocket;

use rocket::{figment::Figment, serde::json::Json};
use types::{ErrResponse, ErrorKind};
use utils::read_config;

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
    #[cfg(debug_assertions)]
    {
        use dotenv::dotenv;

        dotenv().ok();

        println!("Loaded env");
    }

    let config = read_config();

    let figment = Figment::from(rocket::Config::default())
        .merge(("port", config.port()))
        .merge(("address", config.host()));

    rocket::custom(figment)
        .register("/", catchers![not_found, internal_error])
        .manage(config)
        .manage(cache::ConfigCache::new())
        .manage(state::IpState::new())
        .mount(
            "/",
            routes![routes::auto_detect_config_handler, routes::login_handler,],
        )
}

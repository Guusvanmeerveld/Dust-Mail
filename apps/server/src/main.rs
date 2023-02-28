mod cache;
mod constants;
mod fairings;
mod guards;
mod routes;
mod state;
mod types;
mod utils;

#[macro_use]
extern crate rocket;

use rocket::{figment::Figment, http::Status, serde::json::Json};
use types::{ErrResponse, ErrorKind};
use utils::read_config;

#[catch(404)]
fn not_found() -> (Status, Json<ErrResponse>) {
    ErrResponse::new(ErrorKind::NotFound, "Route could not be found")
}

#[catch(500)]
fn internal_error() -> (Status, Json<ErrResponse>) {
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

    let ip_state = state::IpState::new(
        config.rate_limit().max_queries(),
        config.rate_limit().time_span(),
    );

    let cache_state = cache::ConfigCache::new(config.cache().timeout());

    rocket::custom(figment)
        .register("/", catchers![not_found, internal_error])
        .manage(config)
        .manage(ip_state)
        .manage(cache_state)
        .mount(
            "/",
            routes![routes::auto_detect_config_handler, routes::login_handler],
        )
}

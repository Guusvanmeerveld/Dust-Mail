mod cache;
mod constants;
mod fairings;
mod guards;
mod http;
mod oauth2;
mod routes;
mod state;
mod types;
mod utils;

#[macro_use]
extern crate rocket;

use rocket::{figment::Figment, http::Status, serde::json::Json};
use types::{ErrResponse, ErrorKind};
use utils::{generate_random_hex, read_config};

#[catch(404)]
fn not_found() -> (Status, Json<ErrResponse>) {
    ErrResponse::new(ErrorKind::NotFound, "Route could not be found")
}

#[catch(429)]
fn too_many_requests() -> (Status, Json<ErrResponse>) {
    ErrResponse::new(
        ErrorKind::TooManyRequests,
        "Received too many requests from your ip",
    )
}

#[catch(401)]
fn unauthorized() -> (Status, Json<ErrResponse>) {
    ErrResponse::new(ErrorKind::Unauthorized, "Unauthorized")
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
        .merge(("address", config.host()))
        .merge((
            "secret_key",
            config
                .authorization()
                .map(|auth_config| auth_config.secret().to_string())
                .unwrap_or_else(|| generate_random_hex(32)),
        ));

    let ip_state = state::IpState::new(
        config.rate_limit().max_queries(),
        config.rate_limit().time_span(),
    );

    let cache_state = cache::ConfigCache::new(config.cache().timeout());

    let mail_sessions_state = state::GlobalUserSessions::new();

    let http_client = http::HttpClient::new();

    rocket::custom(figment)
        .register(
            "/",
            catchers![not_found, internal_error, too_many_requests, unauthorized],
        )
        .manage(config)
        .manage(http_client)
        .manage(ip_state)
        .manage(cache_state)
        .manage(mail_sessions_state)
        .mount(
            "/",
            routes![
                routes::auto_detect_config_handler,
                routes::settings_handler,
                routes::version_handler,
                routes::login_handler,
                routes::logout_handler
            ],
        )
        .mount(
            "/mail/",
            routes![routes::mail_login_handler, routes::mail_logout_handler,],
        )
        .mount(
            "/mail/boxes",
            routes![
                routes::mail_box_list_handler,
                routes::mail_get_box_handler,
                routes::mail_box_messages_handler,
                routes::mail_box_message_handler
            ],
        )
        .mount(
            "/mail/oauth2",
            routes![
                routes::oauth_get_tokens_handler,
                routes::oauth_redirect_handler
            ],
        )
}

use rocket::{
    form::Form,
    http::{Cookie, CookieJar},
    time::{Duration, OffsetDateTime},
    State,
};

use crate::{
    guards::RateLimiter,
    state::{default_expiry_time, AuthType, Config, GlobalUserSessions},
    types::{ErrResponse, ErrorKind, OkResponse, ResponseResult},
    utils::generate_random_string,
};

#[derive(FromForm)]
pub struct LoginForm<'r> {
    password: Option<&'r str>,
    username: Option<&'r str>,
}

fn check_password(user_input: &str, password: &str) -> bool {
    password.eq(user_input)
}

#[post("/login", data = "<login_body>")]
pub fn login(
    login_body: Form<LoginForm<'_>>,
    cookies: &CookieJar<'_>,
    user_sessions: &State<GlobalUserSessions>,
    _rate_limiter: RateLimiter,
    app_config: &State<Config>,
) -> ResponseResult<String> {
    if cookies.get_private("session").is_some() {
        return Err(ErrResponse::new(
            ErrorKind::BadRequest,
            "You are already logged in",
        ));
    }

    let token_duration = match app_config.authorization() {
        Some(auth_config) => {
            let user_password = match login_body.password {
                Some(password) => password,
                None => {
                    return Err(ErrResponse::new(
                        ErrorKind::BadRequest,
                        "Missing required password parameter in the body data",
                    ))
                }
            };

            match auth_config.auth_type() {
                AuthType::Password => {
                    let password = match auth_config.password() {
                        Some(password_config) => password_config.password(),
                        // On launch we check if the password config is set if the auth type is 'password' in the config.
                        None => unreachable!(),
                    };

                    if !check_password(user_password, password) {
                        return Err(ErrResponse::new(
                            ErrorKind::Unauthorized,
                            "Incorrect password",
                        ));
                    }
                }
                AuthType::User => {}
            };

            Duration::new(*auth_config.expires(), 0)
        }
        None => Duration::new(default_expiry_time(), 0),
    };

    let random_token = generate_random_string(64);

    user_sessions.insert(&random_token);

    let cookie = Cookie::build("session", random_token)
        .expires(OffsetDateTime::now_utc().saturating_add(token_duration))
        .finish();

    cookies.add_private(cookie);

    Ok(OkResponse::new(String::from("Login successfull")))
}

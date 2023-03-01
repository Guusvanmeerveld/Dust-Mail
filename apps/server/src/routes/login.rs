use rocket::{
    form::Form,
    http::{Cookie, CookieJar},
    time::{Duration, OffsetDateTime},
    State,
};

use crate::{
    guards::RateLimiter,
    state::{AuthType, Config},
    types::{ErrResponse, ErrorKind, OkResponse, ResponseResult},
    utils::generate_random_string,
};

#[derive(FromForm)]
pub struct LoginForm<'r> {
    password: &'r str,
    username: Option<&'r str>,
}

#[post("/login", data = "<login_body>")]
pub fn login(
    login_body: Form<LoginForm<'_>>,
    cookies: &CookieJar<'_>,
    _rate_limiter: RateLimiter,
    app_config: &State<Config>,
) -> ResponseResult<String> {
    let auth_config = match app_config.authorization() {
        Some(auth_config) => {
            match auth_config.auth_type() {
                AuthType::Password => {
                    let password = match auth_config.password() {
                        Some(password_config) => password_config.password(),
                        // On launch we check if the password config is set if the auth type is 'password' in the config.
                        None => unreachable!(),
                    };

                    if !login_body.password.eq(password) {
                        return Err(ErrResponse::new(
                            ErrorKind::Unauthorized,
                            "Incorrect password",
                        ));
                    }
                }
                AuthType::User => {}
            };

            auth_config
        }
        None => {
            return Err(ErrResponse::new(
                ErrorKind::InternalError,
                "Login is disabled",
            ))
        }
    };

    let token_duration = Duration::new(*auth_config.expires(), 0);

    let random_token = generate_random_string(64);

    let cookie = Cookie::build("login", random_token)
        .expires(OffsetDateTime::now_utc().saturating_add(token_duration))
        .finish();

    cookies.add_private(cookie);

    Ok(OkResponse::new(String::from("Login successfull")))
}

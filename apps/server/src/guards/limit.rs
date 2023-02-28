use rocket::{
    request::{FromRequest, Outcome},
    serde::json::Json,
    Request, State,
};

use crate::{
    state::IpState,
    types::{ErrResponse, ErrorKind},
};

pub struct RateLimiter {}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for RateLimiter {
    type Error = Json<ErrResponse>;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        // let behind_proxy_result = req
        //     .guard::<&State<Config>>()
        //     .await
        //     .map_failure(|_| {
        //         ErrResponse::new(
        //             ErrorKind::InternalError,
        //             "Failed to get rate limiting state",
        //         )
        //     })
        //     .map(|config| config.behind_proxy());

        // let behind_proxy = match behind_proxy_result {
        //     Outcome::Failure(error) => return Outcome::Failure(error),
        //     Outcome::Forward(forward) => return Outcome::Forward(forward),
        //     Outcome::Success(behind_proxy) => behind_proxy,
        // };

        let client_ip = req.client_ip();

        let client_ip = match client_ip {
            Some(client_ip) => client_ip.to_string(),
            None => {
                let error =
                    ErrResponse::new(ErrorKind::Parse, "Could not detect ip address from request");
                return Outcome::Failure(error);
            }
        };

        let ip_state_result = req.guard::<&State<IpState>>().await.map_failure(|_| {
            ErrResponse::new(
                ErrorKind::InternalError,
                "Failed to get rate limiting state",
            )
        });

        let ip_state = match ip_state_result {
            Outcome::Failure(error) => return Outcome::Failure(error),
            Outcome::Forward(forward) => return Outcome::Forward(forward),
            Outcome::Success(ip_state) => ip_state,
        };

        if ip_state.is_ip_limited(&client_ip) {
            let error = ErrResponse::new(ErrorKind::TooManyRequests, "Too many requests");
            return Outcome::Failure(error);
        }

        ip_state.add_count_to_ip(&client_ip);

        Outcome::Success(RateLimiter {})
    }
}

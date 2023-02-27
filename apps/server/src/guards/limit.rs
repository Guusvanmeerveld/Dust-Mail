use rocket::{
    http::Status,
    request::{self, FromRequest},
    serde::json::Json,
    Request, State,
};

use crate::{state::IpState, types::ErrResponse};

pub struct RateLimiter {}

// #[rocket::async_trait]
// impl<'r> FromRequest<'r> for RateLimiter {
//     type Error = (Status, Json<ErrResponse>);
//     async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
//         let outcome = req.guard::<&State<IpState>>().await.map(|state| {});

//         outcome
//     }
// }

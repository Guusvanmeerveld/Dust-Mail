use serde::Serialize;

use serde_json;

use crate::types::Result;

pub fn to_json<T: Serialize + ?Sized>(data: &T) -> Result<String> {
    let serialized = serde_json::to_string(data)?;

    Ok(serialized)
}

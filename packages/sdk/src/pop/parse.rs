use crate::types::Address;

pub fn parse_address(address_list: String) -> Vec<Address> {
    let split = address_list.split(",\r\t");

    let mut addresses: Vec<Address> = Vec::new();

    for address in split {}

    // todo!()

    addresses
}

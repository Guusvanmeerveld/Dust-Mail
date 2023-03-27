pub const SPACE: char = ' ';

// \n
pub const LF: u8 = 0x0a;
// \r
pub const CR: u8 = 0x0d;

pub const OK: &str = "+OK";
pub const ERR: &str = "-ERR";

// .
pub const DOT: u8 = 0x2e;

pub const END_OF_LINE: [u8; 2] = [CR, LF];
pub const EOF: [u8; 5] = [CR, LF, DOT, CR, LF];

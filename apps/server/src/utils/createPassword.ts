import crypto from "crypto";

const PASSWORD_LENGTH = 999;

const LOWERCASE_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = ",./<>?;'\":[]\\|}{=-_+`~!@#$%^&*()";
const ALPHANUMERIC_CHARS = LOWERCASE_ALPHABET + UPPERCASE_ALPHABET + NUMBERS;

const ALL_CHARS = ALPHANUMERIC_CHARS + SYMBOLS;

const generateRandomPassword = (): string => {
	const randomBytes = crypto.randomBytes(PASSWORD_LENGTH);
	let password = "";

	for (let i = 0; i < PASSWORD_LENGTH; i++) {
		randomBytes[i] = randomBytes[i] % ALL_CHARS.length;
		password += ALL_CHARS[randomBytes[i]];
	}

	return password;
};

export default generateRandomPassword;

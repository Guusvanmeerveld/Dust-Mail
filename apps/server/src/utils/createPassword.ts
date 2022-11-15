import cryptoRandomString from "crypto-random-string";

const generateRandomPassword = async (length?: number): Promise<string> => {
	const password = cryptoRandomString({ length: length ?? 128 });

	return password;
};

export default generateRandomPassword;

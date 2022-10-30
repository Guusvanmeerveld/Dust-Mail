import cryptoRandomString from "crypto-random-string";

const generateRandomPassword = async (): Promise<string> => {
	const password = cryptoRandomString({ length: 128 });

	return password;
};

export default generateRandomPassword;

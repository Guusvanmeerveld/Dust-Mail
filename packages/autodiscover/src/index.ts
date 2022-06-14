import fetchServerWithAutodiscover from "autodiscover";
import validator from "validator";

import AutodiscoverResponse from "./interfaces/emailServer";

const fetchServerFromEmail = async (
	email: string,
	password?: string
): Promise<AutodiscoverResponse> => {
	const isValidEmail = validator.isEmail(email);

	if (!isValidEmail) throw new Error("Email adress is not valid");

	const server = email.split("@").pop() as string;

	let response: AutodiscoverResponse | undefined;

	response = await fetchServerWithAutodiscover(
		server,
		password ? { username: email, password } : undefined
	);

	if (!response)
		throw new Error(`Could not find any email servers related to ${email}`);

	return response;
};

export default fetchServerFromEmail;

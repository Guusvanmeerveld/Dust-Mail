import fetchServerWithThunderbird from "./thunderbird";
// import fetchServerWithAutodiscover from "./autodiscover";

import AutodiscoverResponse from "./interfaces/emailServer";
import validateEmail from "./utils/validateEmail";

/**
 * Will try to find an imap and smtp server based on an email address
 *
 *
 * @param email
 * @returns
 */
const fetchServerFromEmail = async (
	email: string
	// password?: string
): Promise<AutodiscoverResponse> => {
	const isValidEmail = validateEmail(email);

	if (!isValidEmail) throw new Error("Email adress is not valid");

	const server = email.split("@").pop() as string;

	const response:
		| AutodiscoverResponse
		| undefined = await fetchServerWithThunderbird(server, email);

	if (response) return response;

	// response = await fetchServerWithAutodiscover(
	// 	server,
	// 	password ? { username: email, password } : undefined
	// );

	// if (response) return response;

	if (!response)
		throw new Error(`Could not find any email servers related to ${email}`);

	return response;
};

export default fetchServerFromEmail;

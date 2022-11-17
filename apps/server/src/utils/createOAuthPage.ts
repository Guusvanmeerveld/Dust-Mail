import { readFile } from "fs-extra";
import { join } from "path";

import createTokenResponse from "./createTokenResponse";

const pathToOAuthPage = join(process.cwd(), "public", "oauth.html");

const createOAuthPage = async (
	accessToken: string,
	refreshToken: string,
	username: string
): Promise<string> => {
	const tokens = {
		access: createTokenResponse("access", accessToken),
		refresh: createTokenResponse("refresh", refreshToken)
	};

	const oauthPage = await readFile(pathToOAuthPage);

	const data = oauthPage
		.toString()
		.replace("{{access_token}}", JSON.stringify(tokens.access))
		.replace("{{refresh_token}}", JSON.stringify(tokens.refresh))
		.replace("{{username}}", username);

	return data;
};

export default createOAuthPage;

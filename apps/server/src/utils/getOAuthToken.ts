import xoauth2 from "xoauth2";

import { OAuthConfig } from "@auth/interfaces/jwt.interface";

const getOAuthToken = async (
	config: OAuthConfig
): Promise<string | undefined> => {
	const xoauth2gen = xoauth2.createXOAuth2Generator({
		user: config.user.name,
		clientId: config.clientID,
		clientSecret: config.clientSecret,
		accessToken: config.accessToken,
		refreshToken: config.refreshToken,
		accessUrl: config.refreshUrl
	});

	return await new Promise((resolve, reject) =>
		xoauth2gen.getToken((error, token) => {
			if (error) reject(error);
			else if (token) resolve(token);
		})
	);
};

export default getOAuthToken;

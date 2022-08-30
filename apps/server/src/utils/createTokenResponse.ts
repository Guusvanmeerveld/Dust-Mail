import { TokenType, Token } from "@dust-mail/typings";

import { jwtConstants } from "@src/constants";

export default function createTokenResponse(
	type: TokenType,
	token: string
): Token {
	let expiry: number;

	if (type == "access") expiry = jwtConstants.accessTokenExpires;
	else if (type == "refresh") expiry = jwtConstants.getRefreshTokenExpires();

	return {
		type,
		body: token,
		expires: new Date(Date.now() + expiry * 1000)
	};
}

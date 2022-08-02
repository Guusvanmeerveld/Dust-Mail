import { BadRequestException } from "@nestjs/common";

import { getClientInfo } from "./constants";
import Config from "./interfaces/config";

import axios from "axios";

const exchangeToken = async (
	code: string,
	redirect_uri: string
): Promise<Omit<Config, "userID">> => {
	const clientInfo = getClientInfo();

	if (!clientInfo.id || !clientInfo.secret)
		throw new BadRequestException(
			"Google authentication is not supported on this server"
		);

	const { data } = await axios
		.post(
			"https://oauth2.googleapis.com/token",
			{
				code,
				client_id: clientInfo.id,
				client_secret: clientInfo.secret,
				grant_type: "authorization_code",
				redirect_uri
			}
			// {
			// 	headers: { "Content-Type": "application/x-www-form-urlencoded" }
			// }
		)
		.catch(() => {
			throw new BadRequestException("Invalid code");
		});

	if (data)
		return {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expires: new Date(Date.now() + data.expires_in * 1000),
			tokenType: data.token_type
		};
};

export default exchangeToken;

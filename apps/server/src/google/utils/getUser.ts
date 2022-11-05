import axios from "axios";

import { UnauthorizedException } from "@nestjs/common";

const getUser = async (tokenType: string, accessToken: string) => {
	const { data: user } = await axios
		.get<{ id: string; email: string }>(
			`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
			{
				headers: {
					Authorization: `${tokenType} ${accessToken}`
				}
			}
		)
		.catch((e) => {
			console.log(e.response?.data);

			throw new UnauthorizedException("Invalid access token");
		});

	return user;
};

export default getUser;

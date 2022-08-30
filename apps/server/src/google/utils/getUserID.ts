import { UnauthorizedException } from "@nestjs/common";

import axios from "axios";

const getUserID = async (tokenType: string, accessToken: string) => {
	const { data: user } = await axios
		.get<{ id: string }>(
			`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`,
			{
				headers: {
					Authorization: `${tokenType} ${accessToken}`
				}
			}
		)
		.catch(() => {
			throw new UnauthorizedException("Invalid access token");
		});

	return user.id;
};

export default getUserID;

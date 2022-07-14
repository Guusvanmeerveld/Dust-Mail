import { UnauthorizedException } from "@nestjs/common";

import axios from "axios";

const connect = async (token: string): Promise<void> => {
	await axios
		.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`)
		.catch(() => {
			throw new UnauthorizedException("Invalid access token");
		});

	return;
};

export default connect;

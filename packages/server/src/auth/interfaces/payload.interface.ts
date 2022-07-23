import Config from "./config.interface";

export interface AccessTokenPayload {
	accessToken: false;
	body: {
		incoming: Config;
		outgoing: Config;
	};
}

export interface RefreshTokenPayload {
	accessToken: string;
	body: {
		incoming: Config;
		outgoing: Config;
	};
}

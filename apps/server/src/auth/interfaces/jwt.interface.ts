import DefaultConfig from "./config.interface";

import {
	TokenType,
	IncomingServiceType,
	OutgoingServiceType
} from "@dust-mail/typings";

type ConfigType = "basic";

interface BaseConfig {
	configType: ConfigType;
}

export interface OAuthConfig {
	refreshToken: string;
	accessToken?: string;
	refreshUrl: string;
	clientID: string;
	clientSecret: string;
	user: { name: string; id: string };
}

export interface BasicConfig extends BaseConfig {
	configType: "basic";
	oauth?: OAuthConfig;
	incoming: DefaultConfig;
	outgoing: DefaultConfig;
}

export type LoginConfig = BasicConfig;

export interface JwtToken {
	tokenType: TokenType;
	services: {
		incoming: IncomingServiceType;
		outgoing: OutgoingServiceType;
	};
	accessToken?: string;
	body: LoginConfig;
}

import DefaultConfig from "./config.interface";

import {
	TokenType,
	IncomingServiceType,
	OutgoingServiceType
} from "@dust-mail/typings";

import GoogleConfig from "@src/google/interfaces/config";

export interface MultiConfig {
	incoming: DefaultConfig;
	outgoing: DefaultConfig;
}

export interface JwtToken {
	tokenType: TokenType;
	services: {
		incoming: IncomingServiceType;
		outgoing: OutgoingServiceType;
	};
	accessToken?: string;
	body: MultiConfig | GoogleConfig;
}

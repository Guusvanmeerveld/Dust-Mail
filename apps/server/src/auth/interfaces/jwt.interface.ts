import { TokenType } from "@dust-mail/typings";

import GoogleConfig from "@src/google/interfaces/config";

import DefaultConfig from "./config.interface";

export type IncomingServiceType = "imap" | "pop3" | "google";
export type OutgoingServiceType = "smtp" | "google";

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

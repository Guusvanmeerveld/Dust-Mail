import DefaultConfig from "./config.interface";

import { TokenType } from "@dust-mail/typings";

import GoogleConfig from "@src/google/interfaces/config";

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

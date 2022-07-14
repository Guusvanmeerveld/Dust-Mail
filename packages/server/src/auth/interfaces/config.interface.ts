import Tokens from "@utils/google/interfaces/tokens";

export default interface Config {
	mail?: {
		username: string;
		password: string;
		server: string;
		port: number;
		security: SecurityType;
	};
	google?: Tokens;
}

export type PayloadType = "mail" | "google";

export type SecurityType = "NONE" | "STARTTLS" | "TLS";

import GoogleConfig from "@mail/google/interfaces/config";

export default interface Config {
	mail?: {
		username: string;
		password: string;
		server: string;
		port: number;
		security: SecurityType;
	};
	google?: GoogleConfig;
}

export type SecurityType = "NONE" | "STARTTLS" | "TLS";

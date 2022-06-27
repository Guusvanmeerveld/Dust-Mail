export interface EmailServer<T> {
	server: string;
	port: number;
	security: Security;
	type: T;
}

export type Security = "STARTTLS" | "TLS" | "NONE";

export type IncomingServer = "imap" | "pop3";

export type OutgoingServer = "smtp";

type AutodiscoverResponse = [
	EmailServer<IncomingServer> | undefined,
	EmailServer<OutgoingServer> | undefined
];

export default AutodiscoverResponse;

import { IncomingServiceType, OutgoingServiceType } from "@dust-mail/typings";

export interface EmailServer<T> {
	server: string;
	port: number;
	security: Security;
	type: T;
}

export type Security = "STARTTLS" | "TLS" | "NONE";

type AutodiscoverResponse = [
	EmailServer<IncomingServiceType> | undefined,
	EmailServer<OutgoingServiceType> | undefined
];

export default AutodiscoverResponse;

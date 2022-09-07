import { IncomingServiceType, OutgoingServiceType } from "@dust-mail/typings";

export default interface AutoConfigFile {
	clientConfig: {
		emailProvider: {
			domain: string | string[];
			displayName: string;
			displayShortName: string;
			incomingServer: Server[] | Server;
			outgoingServer: Server[] | Server;
		};
	};
}

export interface Server {
	hostname: string;
	port: number;
	socketType: "STARTTLS" | "SSL" | "plain";
	authentication: Authentication;
	"@": {
		type: IncomingServiceType | OutgoingServiceType;
	};
}

type Authentication =
	| "password-cleartext"
	| "password-encrypted"
	| "NTLM"
	| "GSSAPI"
	| "client-IP-address"
	| "TLS-client-cert"
	| "OAuth2"
	| "none";

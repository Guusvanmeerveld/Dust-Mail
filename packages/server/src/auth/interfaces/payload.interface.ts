import Server from "./server.interface";

export interface Payload {
	username: string;
	sub: {
		incoming: Server;
		outgoing: Server;
	};
}

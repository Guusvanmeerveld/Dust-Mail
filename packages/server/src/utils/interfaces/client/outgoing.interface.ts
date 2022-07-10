import { SecurityType } from "@auth/interfaces/server.interface";

import { OutgoingMessage } from "@utils/interfaces/message";

import { State } from "../state.interface";

export interface Config {
	user: {
		name: string;
		password: string;
	};
	server: string;
	port: number;
	security: SecurityType;
}

export default interface OutgoingClient {
	state: State;
	connect: () => Promise<void>;
	send: (message: OutgoingMessage) => Promise<void>;
}

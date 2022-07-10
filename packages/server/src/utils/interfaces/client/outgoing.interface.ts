import { SecurityType } from "@auth/interfaces/server.interface";

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
}

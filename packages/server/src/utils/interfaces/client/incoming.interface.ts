import { SecurityType } from "@auth/interfaces/server.interface";

import {
	IncomingMessage,
	FullIncomingMessage
} from "@utils/interfaces/message";

import { State } from "@utils/interfaces/state.interface";

export interface Config {
	user: {
		name: string;
		password: string;
	};
	server: string;
	port: number;
	security: SecurityType;
}

export interface Box {
	totalMessages: number;
	name: string;
}

export default interface IncomingClient {
	state: State;
	getBoxes: () => Promise<string[]>;
	getBox: (boxName: string, readOnly?: boolean) => Promise<Box>;
	getBoxMessages: (
		boxName: string,
		options: { start: number; end: number }
	) => Promise<IncomingMessage[]>;
	getMessage: (
		id: string,
		boxName: string,
		markAsRead: boolean
	) => Promise<FullIncomingMessage | void>;
	connect: () => Promise<void>;
}

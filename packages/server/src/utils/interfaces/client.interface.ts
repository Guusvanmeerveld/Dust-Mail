import Server from "@auth/interfaces/server.interface";

import Message, { FullMessage } from "@utils/interfaces/message";

import { State } from "./state.interface";

export interface Config {
	user: {
		name: string;
		password: string;
	};
	incoming: Server;
	outgoing: Server;
}

export interface Box {
	totalMessages: number;
	name: string;
}

export default interface Client {
	state: State;
	getBoxes: () => Promise<string[]>;
	getBox: (boxName: string, readOnly?: boolean) => Promise<Box>;
	getBoxMessages: (
		boxName: string,
		options: { start: number; end: number }
	) => Promise<Message[]>;
	getMessage: (
		id: string,
		boxName: string,
		markAsRead: boolean
	) => Promise<FullMessage | void>;
	connect: () => Promise<void>;
}

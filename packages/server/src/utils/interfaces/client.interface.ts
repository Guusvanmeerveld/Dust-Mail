import { State } from "./state.interface";
import Message, { FullMessage } from "@utils/interfaces/message";

export interface Config {
	user: {
		name: string;
		password: string;
	};
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

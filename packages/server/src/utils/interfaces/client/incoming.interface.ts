import EventEmitter from "events";

import {
	IncomingMessage,
	FullIncomingMessage
} from "@utils/interfaces/message";

import { State } from "@utils/interfaces/state.interface";

export interface Box {
	totalMessages: number;
	name: string;
}

export default interface IncomingClient extends EventEmitter {
	state: State;
	getBoxes: () => Promise<{ name: string; id: string }[]>;
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

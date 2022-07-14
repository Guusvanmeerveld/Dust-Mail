import EventEmitter from "events";

import { OutgoingMessage } from "@utils/interfaces/message";

import { State } from "../state.interface";

export default interface OutgoingClient extends EventEmitter {
	state: State;
	connect: () => Promise<void>;
	send: (message: OutgoingMessage) => Promise<void>;
}

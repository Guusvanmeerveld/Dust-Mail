import { State } from "@mail/interfaces/state.interface";
import EventEmitter from "events";

import { OutgoingMessage } from "@dust-mail/typings/message";

export default interface OutgoingClient extends EventEmitter {
	state: State;
	connect: () => Promise<void>;
	send: (message: OutgoingMessage) => Promise<void>;
}

import { OutgoingMessage } from "@dust-mail/typings";

export default interface OutgoingClient {
	send: (message: OutgoingMessage) => Promise<void>;
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
}

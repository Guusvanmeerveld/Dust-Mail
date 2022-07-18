import EventEmitter from "events";

import Config from "@auth/interfaces/config.interface";

import { State } from "@utils/interfaces/state.interface";
import IncomingClient from "@utils/interfaces/client/incoming.interface";
import { IncomingMessage } from "@utils/interfaces/message";

import GoogleConfig from "../interfaces/config";

import connect from "./connect";
import { getBox, getBoxes, getBoxMessages } from "./box";
import { getMessage } from "./message";

export default class IncomingGoogleClient
	extends EventEmitter
	implements IncomingClient
{
	public state = State.NOT_READY;

	private config: GoogleConfig;

	private messages: Map<string, IncomingMessage[]> = new Map();

	private boxMessagesNextPageToken: Map<string, string | undefined> = new Map();

	constructor({ google }: Config) {
		super();

		this.config = { ...google, expires: new Date(google.expires) };
	}

	private refreshToken = async (): Promise<string> => {
		if (this.config.expires.getTime() < Date.now()) {
			console.log("expired");
		}

		return `${this.config.tokenType} ${this.config.accessToken}`;
	};

	public connect = () =>
		this.refreshToken().then(() => connect(this.config.accessToken));

	public getBoxes = () =>
		this.refreshToken().then((authorization) => getBoxes(authorization));

	public getBox = (boxName: string) =>
		this.refreshToken().then((authorization) => getBox(authorization, boxName));

	public getBoxMessages = async (
		boxName: string,
		options: { start: number; end: number }
	) => {
		const current = this.messages.get(boxName);
		console.log(current);

		if (current && current[options.start]) {
			return current.slice(options.start, options.end + 1);
		}

		const [messages, nextPageToken] = await this.refreshToken().then(
			(authorization) =>
				getBoxMessages(authorization, boxName, {
					...options,
					nextPageToken: this.boxMessagesNextPageToken.get(boxName)
				})
		);

		this.boxMessagesNextPageToken.set(boxName, nextPageToken);

		if (current) this.messages.set(boxName, current.concat(messages));
		else this.messages.set(boxName, messages);

		return messages;
	};

	public getMessage = (id: string, boxName: string, markAsRead: boolean) =>
		this.refreshToken().then((authorization) =>
			getMessage(authorization, id, boxName, markAsRead)
		);
}

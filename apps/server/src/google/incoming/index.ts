import { CacheService } from "@cache/cache.service";
import IncomingClient from "@mail/interfaces/client/incoming.interface";

import GoogleConfig from "../interfaces/config";
import { getBox, getBoxes, getBoxMessages } from "./box";
import connect from "./connect";
import { getMessage } from "./message";

import { IncomingMessage } from "@dust-mail/typings";

export default class IncomingGoogleClient implements IncomingClient {
	private messages: Map<string, IncomingMessage[]> = new Map();

	private boxMessagesNextPageToken: Map<string, string | undefined> = new Map();

	private readonly authorization: string;

	constructor(
		private readonly config: GoogleConfig,
		private readonly cacheService: CacheService
	) {
		this.authorization = `${this.config.tokenType} ${this.config.accessToken}`;
	}

	public connect = () => connect(this.config.accessToken);

	public getBoxes = () => getBoxes(this.authorization);

	public getBox = (boxName: string) => getBox(this.authorization, boxName);

	public getBoxMessages = async (
		boxName: string,
		options: { start: number; end: number }
	) => {
		const current = this.messages.get(boxName);
		// console.log(current);

		if (current && current[options.start]) {
			return current.slice(options.start, options.end + 1);
		}

		const [messages, nextPageToken] = await getBoxMessages(
			this.authorization,
			boxName,
			{
				...options,
				nextPageToken: this.boxMessagesNextPageToken.get(boxName)
			}
		);

		this.boxMessagesNextPageToken.set(boxName, nextPageToken);

		if (current) this.messages.set(boxName, current.concat(messages));
		else this.messages.set(boxName, messages);

		return messages;
	};

	public getMessage = (id: string, boxName: string, markAsRead: boolean) =>
		getMessage(this.authorization, id, boxName, markAsRead);
}

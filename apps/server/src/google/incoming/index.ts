import { Readable } from "nodemailer/lib/xoauth2";

import GoogleConfig from "../interfaces/config";
import { getBox, getBoxes, getBoxMessages } from "./box";
import connect from "./connect";
import { getMessage } from "./message";

import { IncomingMessage } from "@dust-mail/typings";

import { CacheService } from "@cache/cache.service";

import IncomingClient, {
	Attachment
} from "@mail/interfaces/client/incoming.interface";
import Flags from "@mail/interfaces/flags";

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

	public createBox = async (boxID: string): Promise<void> => {
		return;
	};

	public deleteBox = async (boxIDs: string[]): Promise<void> => {
		return;
	};

	public renameBox = async (
		oldBoxID: string,
		newBoxID: string
	): Promise<void> => {
		return;
	};

	public getMessageCount = (
		boxes: string[],
		flag: Flags
	): Promise<Record<string, number>> => {
		return new Promise((resolve) => {
			resolve(Object.fromEntries(boxes.map((box) => [box, 0])));
		});
	};

	public getBoxMessages = async (
		boxName: string,
		options: { start: number; end: number; filter: string }
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

	public getMessageAttachment: (
		id: string,
		messageID: string,
		boxID: string
	) => Promise<Attachment>;

	public getMessage = (id: string, boxName: string, markAsRead: boolean) =>
		getMessage(this.authorization, id, boxName, markAsRead);
}

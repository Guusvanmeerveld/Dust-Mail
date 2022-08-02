import Config from "@auth/interfaces/config.interface";
import parseMessage, { createAddress } from "@mail/imap/utils/parseMessage";
import IncomingClient from "@mail/interfaces/client/incoming.interface";
import { State } from "@mail/interfaces/state.interface";
import { EventEmitter } from "events";
import Imap from "imap";

import { getBox, closeBox, getBoxes } from "./box";
import connect from "./connect";
import fetch, { FetchOptions, search, SearchOptions } from "./fetch";

import cleanMainHtml, { cleanTextHtml } from "@utils/cleanHtml";
import {
	IncomingMessage,
	ContentType,
	FullIncomingMessage
} from "@dust-mail/typings/message";

export default class Client extends EventEmitter implements IncomingClient {
	private readonly _client: Imap;

	public state = State.NOT_READY;

	constructor({ mail: config }: Config) {
		super();

		this._client = new Imap({
			user: config.username,
			password: config.password,
			host: config.server,
			port: config.port,
			tls: config.security != "NONE"
		});

		this._client.on("ready", () => {
			this.state = State.READY;
			this.emit("ready");
		});

		this._client.on("end", () => {
			this.state = State.NOT_READY;
			this.emit("end");
		});
	}

	public getBoxes = () => getBoxes(this._client);

	public connect = () => connect(this._client);

	/**
	 *
	 * @param name Box name | e.g. "INBOX" or "Spam"
	 * @param readOnly Read only mode
	 * @returns The box
	 */
	public getBox = (name: string, readOnly?: boolean) =>
		getBox(this._client, name, readOnly);

	/**
	 *
	 * @returns Nothing
	 */
	private closeBox = () => closeBox(this._client);

	private fetch = (options: FetchOptions) => fetch(this._client, options);

	private search = (options: SearchOptions) => search(this._client, options);

	public getBoxMessages = async (
		boxName: string,
		{ start, end }: { start: number; end: number }
	): Promise<IncomingMessage[]> => {
		const box = await this.getBox(boxName);

		const totalMessages = box.totalMessages;

		if (totalMessages <= start) return [];

		const headerBody = "HEADER.FIELDS (FROM SUBJECT MESSAGE-ID)";

		const results = await this.fetch({
			start: totalMessages - start,
			end: totalMessages - end > 0 ? totalMessages - end : 1,
			bodies: headerBody
		}).then((results) =>
			results.map((message) => {
				const parsed = {
					...parseMessage(
						message.bodies.find((body) => body.which == headerBody).body
					),
					flags: { seen: !!message.flags.find((flag) => flag.match(/Seen/)) },
					date: message.date
				};

				return parsed;
			})
		);

		// await this.closeBox();

		return results;
	};

	public getMessage = async (
		id: string,
		boxName: string,
		markAsRead: boolean
	): Promise<FullIncomingMessage | void> => {
		await this.getBox(boxName, false);

		const body = "";

		const ids = await this.search({
			filters: [["HEADER", "Message-ID", id]]
		});

		if (ids.length == 0) return;

		const messages = await this.fetch({
			id: ids,
			bodies: [body],
			markAsRead
		});

		// await this.closeBox();

		if (messages.length == 0) return;

		const message = messages.shift();

		const headers = message.bodies
			.filter((result) => result.which == body)
			.map((result) => ({
				...parseMessage(result.body),
				content: {
					html: result.body.html
						? cleanMainHtml(result.body.html)
						: cleanTextHtml(result.body.textAsHtml),
					type: (result.body.html ? "html" : "text") as ContentType
				},
				cc: Array.isArray(result.body.cc)
					? result.body.cc
							.map((address) => address.value.map(createAddress))
							.flat()
					: result.body.cc?.value.map(createAddress),
				bcc: Array.isArray(result.body.bcc)
					? result.body.bcc
							.map((address) => address.value.map(createAddress))
							.flat()
					: result.body.bcc?.value.map(createAddress),
				to: Array.isArray(result.body.to)
					? result.body.to
							.map((address) => address.value.map(createAddress))
							.flat()
					: result.body.to?.value.map(createAddress)
			}));

		return {
			...headers.shift(),
			date: message.date,
			flags: { seen: !!message.flags.find((flag) => flag.match(/Seen/)) }
		};
	};
}

import Imap from "imap";

import { EventEmitter } from "events";

import Message, { FullMessage } from "@utils/interfaces/message";

import { Config } from "./interfaces/config.interface";
import { State } from "../interfaces/state.interface";

import connect from "./connect";
import { getBox, closeBox, getBoxes } from "./box";
import fetch, { FetchOptions, search, SearchOptions } from "./fetch";

export { Config } from "./interfaces/config.interface";

export { State } from "../interfaces/state.interface";
import MailClient from "../interfaces/client.interface";

import parseMessage, { createAddress } from "./utils/parseMessage";

export default class Client extends EventEmitter implements MailClient {
	private readonly _client: Imap;

	public state = State.NOT_READY;

	constructor(config: Config) {
		super();

		const tls = config.port == 993;

		this._client = new Imap({
			user: config.user.name,
			password: config.user.password,
			host: config.server,
			port: config.port ?? 25,
			tls
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
	): Promise<Message[]> => {
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
					flags: message.flags,
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
		boxName: string
	): Promise<FullMessage | void> => {
		await this.getBox(boxName);

		const body = "";

		const ids = await this.search({
			filters: [["HEADER", "Message-ID", id]]
		});

		if (ids.length == 0) return;

		const messages = await this.fetch({
			id: ids,
			bodies: [body]
		});

		// await this.closeBox();

		if (messages.length == 0) return;

		const message = messages.shift();

		const headers = message.bodies
			.filter((result) => result.which == body)
			.map((result) => ({
				...parseMessage(result.body),
				content: {
					html: result.body.html as string,
					text: result.body.textAsHtml
				},
				to: Array.isArray(result.body.to)
					? result.body.to
							.map((address) => address.value.map(createAddress))
							.flat()
					: result.body.to.value.map(createAddress)
			}));

		return {
			...headers.shift(),

			date: message.date,
			flags: message.flags
		};
	};
}

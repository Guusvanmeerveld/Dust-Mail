import IncomingClient from "@mail/interfaces/client/incoming.interface";
import Imap from "imap";

import { getBox, closeBox, getBoxes } from "./box";
import fetch, { FetchOptions, search, SearchOptions } from "./fetch";

import {
	IncomingMessage,
	ContentType,
	FullIncomingMessage
} from "@dust-mail/typings";

import { CacheService } from "@src/cache/cache.service";
import parseMessage, { createAddress } from "@src/imap/utils/parseMessage";

import cleanMainHtml, { cleanTextHtml } from "@utils/cleanHtml";

export default class Client implements IncomingClient {
	constructor(
		private readonly _client: Imap,
		private readonly cacheService: CacheService
	) {}

	public getBoxes = () => getBoxes(this._client);

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
		markAsRead: boolean,
		noImages: boolean,
		darkMode: boolean
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
						? cleanMainHtml(result.body.html, noImages, darkMode)
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

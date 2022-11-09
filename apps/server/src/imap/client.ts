import Imap from "imap";

import {
	getBox,
	closeBox,
	getBoxes,
	createBox,
	deleteBox,
	renameBox
} from "./box";
import fetch, { FetchOptions, search, SearchOptions } from "./fetch";
import Message from "./interfaces/message.interface";

import {
	IncomingMessage,
	ContentType,
	FullIncomingMessage,
	MessageCountResponse
} from "@dust-mail/typings";

import {
	BadRequestException,
	InternalServerErrorException
} from "@nestjs/common";

import parseMessage, { createAddress } from "@src/imap/utils/parseMessage";
import Flags from "@src/mail/interfaces/flags";

import cleanMainHtml, { cleanTextHtml } from "@utils/cleanHtml";
import uniqueBy from "@utils/uniqueBy";

import { CacheService } from "@cache/cache.service";
import { getCacheTimeout } from "@cache/constants";

import IncomingClient from "@mail/interfaces/client/incoming.interface";

type IncomingMessageWithInternalID = IncomingMessage & { internalID: number };

export default class Client implements IncomingClient {
	constructor(
		private readonly _client: Imap,
		private readonly cacheService: CacheService,
		private readonly identifier: string
	) {
		this.cacheTimeout = getCacheTimeout();
	}

	private readonly cacheTimeout: number;
	private readonly headerBody = "HEADER.FIELDS (FROM SUBJECT MESSAGE-ID)";

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

	private parseImapMessage = (
		fetched: Message,
		boxID: string,
		body: string
	): IncomingMessage => {
		const message = fetched.bodies.find(
			(message) => message.which == body
		).body;

		return {
			...parseMessage(message),
			flags: { seen: !!fetched.flags.find((flag) => flag.match(/Seen/)) },
			date: fetched.date,
			box: { id: boxID }
		};
	};

	private checkForNewMessages = async (
		existingMessages: IncomingMessageWithInternalID[],
		boxID: string
	): Promise<IncomingMessageWithInternalID[]> => {
		const possibleNewMessages = await this.search({
			filters: [["SENTSINCE", new Date(Date.now() - this.cacheTimeout)]]
		});

		const possibleNewMessageIDs = possibleNewMessages.filter(
			(message) =>
				!existingMessages.find(
					(existingMessage) => existingMessage.internalID == message
				)
		);

		if (possibleNewMessageIDs.length != 0) {
			const newMessages: IncomingMessageWithInternalID[] = await this.fetch({
				id: possibleNewMessageIDs,
				bodies: this.headerBody
			}).then((results) =>
				results.map((message, i) => ({
					...this.parseImapMessage(message, boxID, this.headerBody),
					internalID: possibleNewMessageIDs[i]
				}))
			);

			return newMessages;
		}

		return [];
	};

	public createBox = async (boxID: string): Promise<void> =>
		createBox(this._client, boxID);

	public deleteBox = async (boxIDs: string[]): Promise<void> => {
		await Promise.all(
			boxIDs.map(async (boxID) => await deleteBox(this._client, boxID))
		);
	};

	public renameBox = async (
		oldBoxID: string,
		newBoxID: string
	): Promise<void> => renameBox(this._client, oldBoxID, newBoxID);

	public getBoxMessages = async (
		boxID: string,
		{ filter, start, end }: { filter: string; start: number; end: number }
	): Promise<IncomingMessage[]> => {
		const box = await this.getBox(boxID);

		const totalMessages = box.messages.total;

		if (totalMessages <= start) return [];

		let fetchOptions: FetchOptions = { bodies: this.headerBody };

		if (filter.length != 0)
			fetchOptions.id = await this.search({
				filters: [["TEXT", filter]]
			});
		else
			fetchOptions = {
				...fetchOptions,
				start: totalMessages - start,
				end: totalMessages - end > 0 ? totalMessages - end : 1
			};

		if (fetchOptions.id) {
			if (fetchOptions.id.length == 0) return [];
			else fetchOptions.id = fetchOptions.id.slice(0, end - start + 1);
		}

		const cachePath = [this.identifier, "messages", boxID];

		const cached =
			this.cacheService.get<IncomingMessageWithInternalID[]>(cachePath) || [];

		if (cached.length != 0) {
			let results: IncomingMessageWithInternalID[] = [];

			if (fetchOptions.id) {
				results = cached.filter(
					(item) => fetchOptions.id.indexOf(item.internalID) != -1
				);
			} else {
				results = cached.filter(
					(item) =>
						fetchOptions.start >= item.internalID &&
						fetchOptions.end <= item.internalID
				);
			}

			if (results.length != 0) {
				// Check if there are new messages
				if (start == 0) {
					const newMessages = await this.checkForNewMessages(results, boxID);

					if (newMessages.length != 0) {
						results = [...newMessages, ...results];

						await this.cacheService.set<IncomingMessageWithInternalID[]>(
							cachePath,
							results
						);
					}
				}

				return results;
			}
		}

		let results: IncomingMessage[] = await this.fetch(fetchOptions).then(
			(results) =>
				results.map((message) =>
					this.parseImapMessage(message, boxID, this.headerBody)
				)
		);

		results = uniqueBy(results, (key) => key.id);

		if (!fetchOptions.id) {
			const newCache: IncomingMessageWithInternalID[] = results.map(
				(item, i) => ({
					...item,
					internalID: fetchOptions.start - i
				})
			);

			await this.cacheService.set<IncomingMessageWithInternalID[]>(cachePath, [
				...cached,
				...newCache
			]);
		}

		// await this.closeBox();

		return results;
	};

	public getMessageCount = async (
		boxes: string[],
		flag: Flags
	): Promise<MessageCountResponse> =>
		Object.fromEntries(
			await Promise.all(
				boxes.map(async (boxName) => {
					const box = await this.getBox(boxName).catch(() => {
						return;
					});

					let count = 0;

					if (box)
						if (flag == "unread")
							count = box.messages.unseen ?? box.messages.new ?? 0;
						else if (flag == "new") count = box.messages.new;
						else if (flag == "total") count = box.messages.total;
						else throw new BadRequestException("`flag` parameter is not valid");

					return [boxName, count];
				})
			)
		);

	public getMessage = async (
		id: string,
		boxID: string,
		markAsRead: boolean,
		noImages: boolean,
		darkMode: boolean
	): Promise<FullIncomingMessage | void> => {
		await this.getBox(boxID, false);

		const body = "";

		const ids = await this.search({
			filters: [["HEADER", "Message-ID", id]]
		});

		if (ids.length == 0)
			throw new InternalServerErrorException("Message not found");

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
					: result.body.to?.value.map(createAddress),
				box: { id: boxID }
			}));

		const cachePath = [this.identifier, "messages", boxID];

		const cached =
			this.cacheService.get<IncomingMessageWithInternalID[]>(cachePath) || [];

		if (
			markAsRead &&
			cached &&
			cached.length != 0 &&
			!!cached.find(
				(message) => ids.includes(message.internalID) && !message.flags.seen
			)
		) {
			const markedAsRead = cached.map((message) => ({
				...message,
				flags: {
					...message.flags,
					seen: ids.includes(message.internalID) ? true : message.flags.seen
				}
			}));

			await this.cacheService.set(cachePath, markedAsRead);
		}

		const seen = !!message.flags.find((flag) => flag.match(/Seen/));

		return {
			...headers.shift(),
			date: message.date,
			flags: { seen }
		};
	};
}

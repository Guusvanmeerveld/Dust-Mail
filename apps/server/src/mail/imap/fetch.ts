import Imap, { ImapMessageBodyInfo } from "imap";
import { simpleParser } from "mailparser";

import Message from "./interfaces/message.interface";

const fetch = async (
	_client: Imap,
	{ start, end, bodies, markAsRead, id }: FetchOptions
): Promise<Message[]> => {
	return new Promise((resolve, reject) => {
		const toFetch = [];

		if (start && end) toFetch.push(`${start}:${end}`);

		if (id) toFetch.push(...id);

		const query = _client.seq.fetch(toFetch, {
			markSeen: markAsRead ?? false,
			bodies
		});

		const messages: {
			flags: string[];
			date: Date;
			bodies: { stream: NodeJS.ReadableStream; which: string }[];
		}[] = [];

		query.on("message", (msg) => {
			let flags: string[];
			let date: Date;

			const bodies: { stream: NodeJS.ReadableStream; which: string }[] = [];

			msg.on("body", (stream, info: ImapMessageBodyInfo & { seqno: number }) =>
				bodies.push({ stream, which: info.which })
			);

			msg.on(
				"attributes",
				(attribute) => ((date = attribute.date), (flags = attribute.flags))
			);

			msg.on("error", (error) => reject(error));

			msg.on("end", () => messages.push({ date, flags, bodies }));
		});

		query.on("error", (error) => reject(error));

		query.on("end", async () =>
			resolve(
				await Promise.all(
					messages.reverse().map(async (message) => ({
						...message,
						bodies: await Promise.all(
							message.bodies.map(async (body) => ({
								which: body.which,
								body: await simpleParser(body.stream)
							}))
						)
					}))
				)
			)
		);
	});
};

export const search = (
	_client: Imap,
	{ filters }: SearchOptions
): Promise<number[]> =>
	new Promise((resolve, reject) => {
		_client.seq.search(filters, (error, results) => {
			if (error) reject(error);
			if (results) resolve(results);
		});
	});

export interface FetchOptions {
	start?: number;
	end?: number;
	id?: number[];
	includeMessageBody?: boolean;
	bodies?: string[] | string;
	markAsRead?: boolean;
}

export type SearchOptions = { filters: (string | string[])[] };

export default fetch;

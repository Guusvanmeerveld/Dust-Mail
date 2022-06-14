import Imap, { ImapMessageBodyInfo } from "imap";

import { Header, Message } from "./interfaces/message.interface";

const fetch = async (
	_client: Imap,
	{ start, end, includeMessageBody, bodies, filters, markAsSeen }: FetchOptions
): Promise<Message[]> => {
	return new Promise((resolve, reject) => {
		const query = _client.seq.fetch([`${start}:${end}`, ...(filters ?? [])], {
			struct: includeMessageBody ?? false,
			markSeen: markAsSeen ?? false,
			bodies
		});

		const messages: Message[] = [];

		query.on("message", (msg) => {
			let flags: string[];
			let date: Date;
			const headers: Header[] = [];

			msg.on(
				"body",
				(stream, info: ImapMessageBodyInfo & { seqno: number }) => {
					let headersString = "";

					stream.on("data", (chunk: Buffer) => {
						headersString += chunk.toString("utf-8");
					});

					stream.on("end", () => {
						const header = Imap.parseHeader(headersString);

						headers.push({
							which: info.which,
							size: info.size,
							index: info.seqno,
							result: header
						});
					});
				}
			);

			msg.on(
				"attributes",
				(attribute) => ((date = attribute.date), (flags = attribute.flags))
			);

			msg.on("end", () => messages.push({ date, flags, headers }));
		});

		query.on("error", (err) => reject(err));

		query.on("end", () => resolve(messages.reverse()));
	});
};

export interface FetchOptions {
	start: number;
	end: number;
	includeMessageBody?: boolean;
	bodies?: string[] | string;
	filters?: string[];
	markAsSeen?: boolean;
}

export default fetch;

import { Injectable } from "@nestjs/common";

import Client from "../utils/imap";

@Injectable()
export class MailService {
	async fetchMailFromBox(
		client: Client,
		box: string,
		{ start, end }: { start: number; end: number }
	) {
		const data = await client.openBox(box).then(async (box) => {
			const headerBody = "HEADER.FIELDS (FROM TO SUBJECT MESSAGE-ID)";

			const totalMessages = box.messages.total;

			if (totalMessages <= start) return [];

			const results = await client
				.fetch({
					start: totalMessages - start,
					end: totalMessages - end > 0 ? totalMessages - end : 1,
					bodies: headerBody
				})
				.then((results) =>
					results.map((message) => ({
						flags: message.flags,
						headers: message.headers[0].result
					}))
				);

			return results;
		});

		await client.closeBox();

		return data;
	}
}

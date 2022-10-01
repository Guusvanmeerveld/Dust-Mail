import { FullIncomingMessage } from "@dust-mail/typings";

export const getMessage = async (
	authorization: string,
	id: string,
	boxName: string,
	markAsRead: boolean
): Promise<FullIncomingMessage> => {
	return {
		content: {},
		date: new Date(),
		flags: { seen: true },
		box: {
			id: Buffer.from(Math.random().toString(), "utf8").toString("base64")
		},
		from: [],
		id: Buffer.from(Math.random().toString(), "utf8").toString("base64")
	};
};

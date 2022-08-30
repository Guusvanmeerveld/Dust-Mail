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
		from: [],
		id: ""
	};
};

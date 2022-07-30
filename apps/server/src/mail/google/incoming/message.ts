import { FullIncomingMessage } from "@utils/interfaces/message";

export const getMessage = async (
	authorization: string,
	id: string,
	boxName: string,
	markAsRead: boolean
): Promise<FullIncomingMessage> => {
	return { content: {}, date: new Date(), flags: [], from: [], id: "" };
};

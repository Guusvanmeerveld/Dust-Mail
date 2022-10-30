import Flags from "../flags";

import {
	IncomingMessage,
	FullIncomingMessage,
	BoxResponse,
	MessageCountResponse
} from "@dust-mail/typings";

export interface Box {
	messages: { total: number; new: number; unseen: number };
	name: string;
}

export default interface IncomingClient {
	getBoxes: () => Promise<BoxResponse[]>;
	getBox: (boxName: string, readOnly?: boolean) => Promise<Box>;
	getBoxMessages: (
		boxName: string,
		options: { filter: string; start: number; end: number }
	) => Promise<IncomingMessage[]>;
	createBox: (boxID: string) => Promise<void>;
	deleteBox: (boxIDs: string[]) => Promise<void>;
	renameBox: (oldBoxID: string, newBoxID: string) => Promise<void>;
	getMessageCount: (
		boxes: string[],
		flag: Flags
	) => Promise<MessageCountResponse>;
	getMessage: (
		id: string,
		boxName: string,
		markAsRead: boolean,
		noImages: boolean,
		darkMode: boolean
	) => Promise<FullIncomingMessage | void>;
}

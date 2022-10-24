import {
	IncomingMessage,
	FullIncomingMessage,
	BoxResponse
} from "@dust-mail/typings";

export interface Box {
	totalMessages: number;
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
	getMessage: (
		id: string,
		boxName: string,
		markAsRead: boolean,
		noImages: boolean,
		darkMode: boolean
	) => Promise<FullIncomingMessage | void>;
}

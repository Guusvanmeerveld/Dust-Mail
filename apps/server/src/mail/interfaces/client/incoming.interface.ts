import { Readable } from "stream";

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

export type Attachment = [
	Readable,
	{ contentType: string; contentDisposition: string; id: string }
];

export default interface IncomingClient {
	getBoxes: () => Promise<BoxResponse[]>;
	getBox: (boxID: string, readOnly?: boolean) => Promise<Box>;
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
	getMessageAttachment: (
		id: string,
		messageID: string,
		boxID: string
	) => Promise<Attachment | void>;
	getMessage: (
		id: string,
		boxID: string,
		markAsRead: boolean,
		noImages: boolean,
		darkMode: boolean
	) => Promise<FullIncomingMessage | void>;
}

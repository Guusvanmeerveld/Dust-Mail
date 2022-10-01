/**
 * An object containing basic data about a sender / receiver
 */
export interface Address {
	displayName: string;
	email: string;
}

export interface OutgoingMessage {
	from: Address;
	to: Address[] | Address;
	cc: Address[] | Address;
	bcc: Address[] | Address;
	subject: string;
	content: string;
	replyTo?: Address;
	inReplyTo?: string;
}

export interface Flags {
	seen: boolean;
}

/**
 * An object containing basic data about an incoming email
 */
export interface IncomingMessage {
	flags: Flags;
	subject?: string;
	date: Date;
	from: Address[];
	box: { id: string };
	id: string;
}

export type ContentType = "html" | "text";

/**
 * An object containing all data about an incoming email
 */
export interface FullIncomingMessage extends IncomingMessage {
	to?: Address[];
	bcc?: Address[];
	cc?: Address[];
	content: {
		type?: ContentType;
		html?: string;
	};
}

/**
 * An object containing basic data about the sender
 */
export interface Address {
	displayName: string;
	email: string;
}

/**
 * An object containing basic data about an email
 */
export default interface Message {
	flags: string[];
	subject?: string;
	date: Date;
	from: Address[];
	id: string;
}

export type ContentType = "html" | "text";

export interface FullMessage extends Message {
	to?: Address[];
	bcc?: Address[];
	cc?: Address[];
	content: {
		type?: ContentType;
		html?: string;
	};
}

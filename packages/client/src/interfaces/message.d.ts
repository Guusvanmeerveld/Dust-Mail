/**
 * An object containing basic data about the sender
 */
export interface Address {
	displayName: string;
	email: string;
	avatar: string;
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

export interface FullMessage extends Message {
	to?: Address[];
	bcc?: string[];
	cc?: string[];
	content: {
		text: string;
		html: string;
	};
}

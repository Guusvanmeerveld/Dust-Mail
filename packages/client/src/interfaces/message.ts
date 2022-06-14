export interface BasicMessage {
	flags: string[];
	headers: {
		subject: string;
		from: string;
		to: string;
		"message-id": string;
	};
}

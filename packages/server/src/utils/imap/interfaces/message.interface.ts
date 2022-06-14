export interface Message {
	flags: string[];
	date: Date;
	headers: Header[];
}

export interface Header {
	which: string;
	size: number;
	index: number;
	result: {
		[key: string]: string[];
	};
}

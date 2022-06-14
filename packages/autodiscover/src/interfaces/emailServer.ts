interface EmailServer<T> {
	server: string;
	port: number;
	type: T;
}

type AutodiscoverResponse = [EmailServer<"imap">, EmailServer<"smtp">];

export default AutodiscoverResponse;

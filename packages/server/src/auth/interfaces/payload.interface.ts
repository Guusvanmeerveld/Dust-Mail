export interface Payload {
	username: string;
	sub: {
		server: string;
		port: number;
		password: string;
	};
}

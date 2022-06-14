export interface Config {
	user: {
		name: string;
		password: string;
	};
	server: string;
	port?: number;
}

export default interface Server {
	username: string;
	password: string;
	server: string;
	port: number;
	security: SecurityType;
}

export type SecurityType = "NONE" | "STARTTLS" | "TLS";

export default interface Server {
	server: string;
	port: number;
	security: SecurityType;
}

export type SecurityType = "NONE" | "STARTTLS" | "TLS";

export default interface AdvancedLogin {
	username?: string;
	password?: string;
	server?: string;
	port?: number;
	security?: SecurityType;
}

export type SecurityType = "NONE" | "STARTTLS" | "TLS";
export type ServerType = "incoming" | "outgoing";

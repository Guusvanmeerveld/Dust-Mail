export default interface AdvancedLogin {
	server?: string;
	port?: number;
	security?: SecurityType;
}

export type SecurityType = "NONE" | "STARTTLS" | "TLS";
export type ServerType = "incoming" | "outgoing";

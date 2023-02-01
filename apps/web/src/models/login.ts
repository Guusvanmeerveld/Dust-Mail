import z from "zod";

export const ConnectionSecurity = z.enum(["Tls", "StartTls", "Plain"]);

export const incomingMailServerTypeList = ["Imap", "Pop", "Exchange"] as const;
export const outgoingMailServerTypeList = ["Smtp"] as const;

export const IncomingMailServerType = z.enum(incomingMailServerTypeList);
export const OutgoingMailServerType = z.enum(outgoingMailServerTypeList);

export const MailServerType = z.union([
	IncomingMailServerType,
	OutgoingMailServerType
]);

export const IncomingServerTypeString = "incoming" as const;
export const OutgoingServerTypeString = "outgoing" as const;

export const IncomingServerType = z.literal(IncomingServerTypeString);
export const OutgoingServerType = z.literal(OutgoingServerTypeString);

export const ServerType = z.union([IncomingServerType, OutgoingServerType]);

export const LoginOptions = z
	.object({
		username: z.string(),
		password: z.string(),
		domain: z.string(),
		port: z.number(),
		clientType: z.union([z.string(), z.record(ServerType, MailServerType)]),
		security: ConnectionSecurity
	})
	.array();

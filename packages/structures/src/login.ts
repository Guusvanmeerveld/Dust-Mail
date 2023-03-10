import z from "zod";

export const ConnectionSecurityModel = z.enum(["Tls", "StartTls", "Plain"]);

export type ConnectionSecurity = z.infer<typeof ConnectionSecurityModel>;

export const incomingMailServerTypeList = ["Imap", "Pop", "Exchange"] as const;
export const outgoingMailServerTypeList = ["Smtp"] as const;

export const IncomingMailServerTypeModel = z.enum(incomingMailServerTypeList);
export type IncomingMailServerType = z.infer<
	typeof IncomingMailServerTypeModel
>;

export const OutgoingMailServerTypeModel = z.enum(outgoingMailServerTypeList);
export type OutgoingMailServerType = z.infer<
	typeof OutgoingMailServerTypeModel
>;

export const MailServerTypeModel = z.union([
	IncomingMailServerTypeModel,
	OutgoingMailServerTypeModel
]);
export type MailServerType = z.infer<typeof MailServerTypeModel>;

export const IncomingServerTypeString = "incoming" as const;
export const OutgoingServerTypeString = "outgoing" as const;

export const IncomingServerTypeModel = z.literal(IncomingServerTypeString);
export type IncomingServerType = z.infer<typeof IncomingServerTypeModel>;

export const OutgoingServerTypeModel = z.literal(OutgoingServerTypeString);
export type OutgoingServerType = z.infer<typeof OutgoingServerTypeModel>;

export const ServerTypeModel = z.union([
	IncomingServerTypeModel,
	OutgoingServerTypeModel
]);
export type ServerType = z.infer<typeof ServerTypeModel>;

export const LoginOptionsModel = z.object({
	username: z.string(),
	password: z.string(),
	domain: z.string(),
	port: z.number(),
	security: ConnectionSecurityModel
});
export type LoginOptions = z.infer<typeof LoginOptionsModel>;

export const CredentialsModel = z.object({
	incoming: LoginOptionsModel,
	incoming_type: IncomingMailServerTypeModel
});
export type Credentials = z.infer<typeof CredentialsModel>;

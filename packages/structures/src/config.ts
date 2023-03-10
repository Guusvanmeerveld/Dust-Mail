import z from "zod";

import {
	ConnectionSecurityModel,
	IncomingMailServerTypeModel,
	OutgoingMailServerTypeModel,
	IncomingServerTypeString,
	OutgoingServerTypeString
} from "./login";

export const AuthTypeModel = z.enum([
	"ClearText",
	"Encrypted",
	"OAuth2",
	"None",
	"Unknown"
]);
export type AuthType = z.infer<typeof AuthTypeModel>;

const ServerConfigModel = z.object({
	port: z.number(),
	domain: z.string(),
	security: ConnectionSecurityModel,
	authType: AuthTypeModel.array()
});
export type ServerConfig = z.infer<typeof ServerConfigModel>;

const IncomingServerConfigModel = ServerConfigModel.extend({
	type: IncomingMailServerTypeModel
});
export type IncomingServerConfig = z.infer<typeof IncomingServerConfigModel>;

const OutgoingServerConfigModel = ServerConfigModel.extend({
	type: OutgoingMailServerTypeModel
});
export type OutgoingServerConfig = z.infer<typeof OutgoingServerConfigModel>;

export const ConfigTypeModel = z.record(
	z.literal("multiServer"),
	z.object({
		[IncomingServerTypeString]: IncomingServerConfigModel.array(),
		[OutgoingServerTypeString]: OutgoingServerConfigModel.array()
	})
);
export type ConfigType = z.infer<typeof ConfigTypeModel>;

export const MailConfigModel = z.object({
	type: ConfigTypeModel,
	provider: z.string(),
	displayName: z.string()
});
export type MailConfig = z.infer<typeof MailConfigModel>;

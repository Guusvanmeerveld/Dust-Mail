import z from "zod";

import {
	ConnectionSecurity,
	IncomingMailServerType,
	IncomingServerType,
	OutgoingServerType,
	OutgoingMailServerType,
	IncomingServerTypeString,
	OutgoingServerTypeString
} from "./login";

const AuthType = z.enum([
	"ClearText",
	"Encrypted",
	"OAuth2",
	"None",
	"Unknown"
]);

const ServerConfig = z.object({
	port: z.number(),
	domain: z.string(),
	security: ConnectionSecurity,
	authType: AuthType.array()
});

const IncomingServerConfig = ServerConfig.extend({
	type: IncomingMailServerType
});

const OutgoingServerConfig = ServerConfig.extend({
	type: OutgoingMailServerType
});

export const ConfigType = z.record(
	z.literal("multiServer"),
	z.object({
		[IncomingServerTypeString]: IncomingServerConfig.array(),
		[OutgoingServerTypeString]: OutgoingServerConfig.array()
	})
);

export const MailConfig = z.object({
	type: ConfigType,
	provider: z.string(),
	displayName: z.string()
});

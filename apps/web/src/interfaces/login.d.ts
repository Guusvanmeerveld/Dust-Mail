import z from "zod";

import { AuthType as AuthTypeModel } from "@models/config";
import {
	ConnectionSecurity as ConnectionSecurityModel,
	MailServerType as MailServerTypeModel,
	ServerType as ServerTypeModel,
	IncomingMailServerType as IncomingMailServerTypeModel,
	OutgoingMailServerType as OutgoingMailServerTypeModel
} from "@models/login";

export default interface MultiServerLoginOptions {
	username: string;
	password: string;
	domain: string;
	port: number;
	security: ConnectionSecurity;
	loginType: z.infer<typeof AuthTypeModel>[];
}

type IncomingMailServerType = z.infer<typeof IncomingMailServerTypeModel>;
type OutgoingMailServerType = z.infer<typeof OutgoingMailServerTypeModel>;

export type MailServerType = z.infer<typeof MailServerTypeModel>;

export type ConnectionSecurity = z.infer<typeof ConnectionSecurityModel>;

export type ServerType = z.infer<typeof ServerTypeModel>;

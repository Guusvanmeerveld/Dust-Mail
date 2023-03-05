import z from "zod";

import { MailConfig } from "@models/config";
import { Credentials } from "@models/login";
import { MailBoxList, MailBox } from "@models/mailbox";
import { Version } from "@models/version";

import { Result } from "@interfaces/result";

// TODO: Fully implement api specification

export default interface MailClient {
	getVersion: () => Promise<Result<z.infer<typeof Version>>>;
	detectConfig: (
		emailAddress: string
	) => Promise<Result<z.infer<typeof MailConfig>>>;
	login: (options: z.infer<typeof Credentials>) => Promise<Result<string>>;
	get: (boxId?: string) => Promise<Result<z.infer<typeof MailBox>>>;
	list: () => Promise<Result<z.infer<typeof MailBoxList>>>;
	messageList: (
		page: number,
		boxId?: string
	) => Promise<Result<z.infer<typeof Preview>>>;
	getMessage: (
		messageId?: string,
		boxId?: string
	) => Promise<Result<z.infer<typeof Message>>>;
}

import z from "zod";

import { MailConfig } from "@models/config";
import { LoginOptions } from "@models/login";
import { MailBoxList, MailBox } from "@models/mailbox";
import { Version } from "@models/version";

// TODO: Fully implement api specification

export default interface MailClient {
	getVersion: () => Promise<z.infer<typeof Version>>;
	detectConfig: (emailAddress: string) => Promise<z.infer<typeof MailConfig>>;
	login: (options: z.infer<typeof LoginOptions>) => Promise<string>;
	get: (boxId?: string) => Promise<z.infer<typeof MailBox>>;
	list: () => Promise<z.infer<typeof MailBoxList>>;
	messageList: (
		page: number,
		boxId?: string
	) => Promise<z.infer<typeof Preview>>;
	getMessage: (
		messageId?: string,
		boxId?: string
	) => Promise<z.infer<typeof Message>>;
}

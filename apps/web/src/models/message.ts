import z from "zod";

import { Address } from "./address";
import { Preview } from "./preview";

export const Content = z.object({
	text: z.string().nullable(),
	html: z.string().nullable()
});

export const Message = Preview.extend({
	to: Address.array(),
	cc: Address.array(),
	bcc: Address.array(),
	headers: z.record(z.string(), z.string()),
	content: Content
});

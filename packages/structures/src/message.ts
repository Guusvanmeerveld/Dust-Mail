import z from "zod";

import { AddressModel } from "./address";
import { PreviewModel } from "./preview";

export const ContentModel = z.object({
	text: z.string().nullable(),
	html: z.string().nullable()
});
export type Content = z.infer<typeof ContentModel>;

export const MessageModel = PreviewModel.extend({
	to: AddressModel.array(),
	cc: AddressModel.array(),
	bcc: AddressModel.array(),
	headers: z.record(z.string(), z.string()),
	content: ContentModel
});
export type Message = z.infer<typeof MessageModel>;

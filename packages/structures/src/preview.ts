import z from "zod";

import { AddressModel } from "./address";
import { FlagModel } from "./flag";

export const PreviewModel = z.object({
	from: AddressModel.array(),
	flags: FlagModel.array(),
	id: z.string(),
	sent: z.number().nullable(),
	subject: z.string().nullable()
});
export type Preview = z.infer<typeof PreviewModel>;

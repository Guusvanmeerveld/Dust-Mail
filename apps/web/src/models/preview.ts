import z from "zod";

import { Address } from "./address";
import { Flag } from "./flag";

export const Preview = z.object({
	from: Address.array(),
	flags: Flag.array(),
	id: z.string(),
	sent: z.number().nullable(),
	subject: z.string().nullable()
});

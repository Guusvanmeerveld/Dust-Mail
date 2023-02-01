import z from "zod";

export const Address = z.object({
	name: z.string().nullable(),
	address: z.string().nullable()
});

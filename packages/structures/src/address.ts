import z from "zod";

export const AddressModel = z.object({
	name: z.string().nullable(),
	address: z.string().nullable()
});

export type Address = z.infer<typeof AddressModel>;

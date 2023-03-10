import z from "zod";

export const FlagModel = z.union([
	z.enum(["Read", "Deleted", "Answered", "Flagged", "Draft"]),
	z.record(z.literal("Custom"), z.string().nullable())
]);

export type Flag = z.infer<typeof FlagModel>;

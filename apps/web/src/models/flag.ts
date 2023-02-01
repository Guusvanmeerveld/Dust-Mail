import z from "zod";

export const Flag = z.union([
	z.enum(["Read", "Deleted", "Answered", "Flagged", "Draft"]),
	z.record(z.literal("Custom"), z.string().nullable())
]);

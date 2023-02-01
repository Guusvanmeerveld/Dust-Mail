import z from "zod";

export const Version = z.object({
	version: z.string(),
	type: z.enum(["git", "stable"])
});

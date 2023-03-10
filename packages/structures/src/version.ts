import z from "zod";

export const VersionModel = z.object({
	version: z.string(),
	type: z.enum(["git", "stable"])
});
export type Version = z.infer<typeof VersionModel>;

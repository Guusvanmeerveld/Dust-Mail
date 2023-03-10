import z from "zod";

export const ApiSettingsModel = z.object({
	authorization: z.boolean(),
	authorization_type: z.enum(["password", "user"])
});
export type ApiSettings = z.infer<typeof ApiSettingsModel>;

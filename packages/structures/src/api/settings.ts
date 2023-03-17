import z from "zod";

export const ApiSettingsModel = z.object({
	authorization: z.boolean(),
	authorization_type: z.enum(["password", "user"]).nullable()
});
export type ApiSettings = z.infer<typeof ApiSettingsModel>;

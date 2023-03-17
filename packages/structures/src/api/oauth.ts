import z from "zod";

export const OAuthStateModel = z.object({
	provider: z.string(),
	application: z.enum(["desktop", "web"])
});
export type OAuthState = z.infer<typeof OAuthStateModel>;

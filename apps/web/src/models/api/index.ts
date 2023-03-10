import z from "zod";

import { Error as ErrorModel } from "../error";

export const OkResponseModel = z.object({
	ok: z.literal(true),
	data: z.unknown()
});

export const ErrorResponseModel = z.object({
	ok: z.literal(false),
	error: ErrorModel
});

export const ResponseModel = z.union([ErrorResponseModel, OkResponseModel]);

export type Response =
	| z.infer<typeof OkResponseModel>
	| z.infer<typeof ErrorModel>;

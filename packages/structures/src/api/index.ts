import z from "zod";

import { AppError, AppErrorModel } from "../error";

export const ApiOkResponseModel = z.object({
	ok: z.literal(true),
	data: z.unknown()
});
export type ApiOkResponse = z.infer<typeof ApiOkResponseModel>;

export const ApiErrorResponseModel = z.object({
	ok: z.literal(false),
	error: AppErrorModel
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseModel>;

export const ApiResponseModel = z.union([
	ApiErrorResponseModel,
	ApiOkResponseModel
]);

export type ApiResponse = ApiOkResponse | AppError;

export * from "./settings";
export * from "./oauth";

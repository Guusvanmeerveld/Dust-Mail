import z from "zod";

import parseZodOutput from "./parseZodOutput";

import { Error as ErrorModel } from "@models/error";

import { Error } from "@interfaces/result";

export const errorToString = (error: z.infer<typeof ErrorModel>): string => {
	const messages: string[] = [];

	if (typeof error.kind != "string") {
		Object.values(error.kind).forEach((error) =>
			messages.push(errorToString(error))
		);
	} else {
		messages.push(`[${error.kind}]: ` + error.message);
	}

	return messages.join(": ");
};

export const parseError = (
	error: unknown
): { ok: false; error: z.infer<typeof ErrorModel> } => {
	const errorParsed = ErrorModel.safeParse(error);

	const errorResult = parseZodOutput(errorParsed);

	if (errorResult.ok) {
		return { ok: false, error: errorResult.data };
	} else {
		return errorResult;
	}
};

export const createBaseError = (error: z.infer<typeof ErrorModel>): Error => ({
	ok: false,
	error
});

export const createErrorFromUnknown = (
	unknown: unknown
): z.infer<typeof ErrorModel> => {
	return {
		kind: "Unknown",
		message: JSON.stringify(unknown)
	};
};

export const errorIsOfErrorKind = (
	error: z.infer<typeof ErrorModel>,
	kind: string
): boolean => {
	if (typeof error.kind != "string") {
		const isOfKindArray = Object.values(error.kind).map((error) =>
			errorIsOfErrorKind(error, kind)
		);

		return isOfKindArray.find((isOfKind) => isOfKind) == true;
	} else return error.kind == kind;
};

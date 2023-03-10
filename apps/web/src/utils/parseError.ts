import parseZodOutput from "./parseZodOutput";

import { AppError, AppErrorModel } from "@dust-mail/structures";

import { ErrorResult } from "@interfaces/result";

export const errorToString = (error: AppError): string => {
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

export const parseError = (error: unknown): { ok: false; error: AppError } => {
	const errorParsed = AppErrorModel.safeParse(error);

	const errorResult = parseZodOutput(errorParsed);

	if (errorResult.ok) {
		return { ok: false, error: errorResult.data };
	} else {
		return errorResult;
	}
};

export const createBaseError = (error: AppError): ErrorResult => ({
	ok: false,
	error
});

export const createErrorFromUnknown = (unknown: unknown): AppError => {
	return {
		kind: "Unknown",
		message: JSON.stringify(unknown)
	};
};

export const createResultFromUnknown = (unknown: unknown): ErrorResult =>
	createBaseError(createErrorFromUnknown(unknown));

export const errorIsOfErrorKind = (error: AppError, kind: string): boolean => {
	if (typeof error.kind != "string") {
		const isOfKindArray = Object.values(error.kind).map((error) =>
			errorIsOfErrorKind(error, kind)
		);

		return isOfKindArray.find((isOfKind) => isOfKind) == true;
	} else return error.kind == kind;
};

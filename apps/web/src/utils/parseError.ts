import z from "zod";

import { Error } from "@models/error";

export const errorToString = (error: z.infer<typeof Error>): string => {
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

export const errorIsOfErrorKind = (
	error: z.infer<typeof Error>,
	kind: string
): boolean => {
	if (typeof error.kind != "string") {
		const isOfKindArray = Object.values(error.kind).map((error) =>
			errorIsOfErrorKind(error, kind)
		);

		return isOfKindArray.find((isOfKind) => isOfKind) == true;
	} else return error.kind == kind;
};

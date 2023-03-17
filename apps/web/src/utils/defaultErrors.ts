import { createBaseError } from "./parseError";

import { ErrorResult } from "@interfaces/result";

export const NotLoggedIn = (): ErrorResult =>
	createBaseError({
		kind: "NotLoggedIn",
		message: "Could not find session token in local storage"
	});

export const NotImplemented = (feature?: string): ErrorResult =>
	createBaseError({
		kind: "NotImplemented",
		message: `The feature ${
			feature ? `'${feature}'` : ""
		} is not yet implemented`
	});

export const MissingRequiredParam = (): ErrorResult =>
	createBaseError({
		kind: "MissingRequiredParam",
		message: "Missing a required parameter"
	});

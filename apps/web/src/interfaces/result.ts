import { AppError } from "@dust-mail/structures";

export interface ErrorResult {
	ok: false;
	error: AppError;
}

export interface OkResult<T> {
	ok: true;
	data: T;
}

export type Result<T> = OkResult<T> | ErrorResult;

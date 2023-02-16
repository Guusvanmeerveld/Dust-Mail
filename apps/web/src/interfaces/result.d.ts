import { Error as ErrorModel } from "@models/error";

export interface Error {
	ok: false;
	error: z.infer<typeof ErrorModel>;
}

export interface Ok<T> {
	ok: true;
	data: T;
}

export type Result<T> = Ok<T> | Error;

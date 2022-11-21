import { ErrorResponse } from "@dust-mail/typings";

type Error = ErrorResponse | { message: string; statusCode: number };

export default Error;

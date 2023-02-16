import z from "zod";

import { Result } from "@interfaces/result";

const parseZodOutput = <T>(output: z.SafeParseReturnType<T, T>): Result<T> => {
	if (!output.success) {
		const errorList = output.error.format();

		return {
			ok: false,
			error: {
				message: `Error parsing server response: ${JSON.stringify(errorList)}`,
				kind: "ZodError"
			}
		};
	} else {
		return { ok: true, data: output.data };
	}
};

export default parseZodOutput;

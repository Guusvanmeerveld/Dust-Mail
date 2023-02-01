import z from "zod";

const parseZodOutput = <T>(output: z.SafeParseReturnType<T, T>): T => {
	if (!output.success) {
		const errorList = output.error.format();

		throw {
			message: `Error parsing server response: ${JSON.stringify(errorList)}`,
			kind: "ZodError"
		};
	} else {
		return output.data;
	}
};

export default parseZodOutput;

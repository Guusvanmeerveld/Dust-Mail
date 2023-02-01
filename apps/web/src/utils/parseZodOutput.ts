import z from "zod";

const parseZodOutput = <T>(output: z.SafeParseReturnType<T, T>): T => {
	if (!output.success) {
		const errorList = output.error.format();

		console.error(errorList);

		throw {
			message: `Error parsing server response: ${JSON.stringify(
				errorList
			).slice(0, 100)}...`,
			kind: "ZodError"
		};
	} else {
		return output.data;
	}
};

export default parseZodOutput;

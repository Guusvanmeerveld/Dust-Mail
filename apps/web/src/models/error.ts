import z from "zod";

interface Error {
	message: string;
	kind: string | Record<string, Error>;
}

export const Error: z.ZodType<Error> = z.lazy(() =>
	z.object({
		message: z.string(),
		kind: z.union([z.string(), z.record(z.string(), Error)])
	})
);

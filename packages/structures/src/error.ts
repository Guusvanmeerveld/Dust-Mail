import z from "zod";

export interface AppError {
	message: string;
	kind: string | Record<string, AppError>;
}

export const AppErrorModel: z.ZodType<AppError> = z.lazy(() =>
	z.object({
		message: z.string(),
		kind: z.union([z.string(), z.record(z.string(), AppErrorModel)])
	})
);

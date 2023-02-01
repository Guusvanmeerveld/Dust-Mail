import z from "zod";

export const Counts = z.object({
	unseen: z.number(),
	total: z.number()
});

interface MailBox {
	counts: z.infer<typeof Counts> | null;
	delimiter: string | null;
	children: MailBox[];
	id: string;
	name: string;
}

export const MailBox: z.ZodType<MailBox> = z.lazy(() =>
	z.object({
		counts: Counts.nullable(),
		delimiter: z.string().nullable(),
		children: MailBox.array(),
		id: z.string(),
		name: z.string()
	})
);

export const MailBoxList = MailBox.array();

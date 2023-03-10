import z from "zod";

export const CountsModel = z.object({
	unseen: z.number(),
	total: z.number()
});
export type Counts = z.infer<typeof CountsModel>;

export interface MailBox {
	counts: z.infer<typeof CountsModel> | null;
	delimiter: string | null;
	children: MailBox[];
	selectable: boolean;
	id: string;
	name: string;
}

export const MailBoxModel: z.ZodType<MailBox> = z.lazy(() =>
	z.object({
		counts: CountsModel.nullable(),
		delimiter: z.string().nullable(),
		children: MailBoxModel.array(),
		selectable: z.boolean(),
		id: z.string(),
		name: z.string()
	})
);

export const MailBoxListModel = MailBoxModel.array();
export type MailBoxList = z.infer<typeof MailBoxListModel>;

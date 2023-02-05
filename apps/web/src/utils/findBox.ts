import z from "zod";

import { MailBoxList, MailBox } from "@models/mailbox";

const findBox = (
	idToFind: string,
	boxes: z.infer<typeof MailBoxList>
): z.infer<typeof MailBox> | undefined => {
	if (boxes.length < 1) return undefined;

	const foundBox = boxes.find((mailbox) => mailbox.id == idToFind);

	if (foundBox) return foundBox;

	const foundBoxes = boxes
		.map((mailbox) => findBox(idToFind, mailbox.children))
		.filter((box) => box != undefined);

	return foundBoxes[0];
};

export default findBox;

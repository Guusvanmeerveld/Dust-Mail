import findBoxInPrimaryBoxesList from "./findBoxInPrimaryBoxesList";

import { MailBoxList, MailBox } from "@dust-mail/structures";

const findBox = (idToFind: string, boxes: MailBoxList): MailBox | undefined => {
	if (boxes.length < 1) return undefined;

	const foundBox = boxes.find((mailbox) => mailbox.id == idToFind);

	if (foundBox) {
		const primaryBoxData = findBoxInPrimaryBoxesList(foundBox.id);

		return { ...foundBox, ...primaryBoxData };
	}

	const foundBoxes = boxes
		.map((mailbox) => findBox(idToFind, mailbox.children))
		.filter((box) => box != undefined);

	return foundBoxes[0];
};

export default findBox;

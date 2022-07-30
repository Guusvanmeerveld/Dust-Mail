import { Box } from "@mail/interfaces/client/incoming.interface";
import Imap from "imap";

export const getBox = async (
	_client: Imap,
	name: string,
	readOnly?: boolean
): Promise<Box> => {
	return new Promise((resolve, reject) =>
		_client.openBox(name, readOnly ?? true, (err, box) => {
			if (box) resolve({ totalMessages: box.messages.total, name: box.name });
			if (err) reject(err);
		})
	);
};

export const closeBox = async (_client: Imap): Promise<void> => {
	return new Promise((resolve, reject) => {
		_client.closeBox((err) => {
			if (err) reject(err);
			else resolve();
		});
	});
};

export const getBoxes = async (
	_client: Imap
): Promise<{ name: string; id: string }[]> => {
	return new Promise((resolve, reject) => {
		_client.getBoxes((err, boxes) => {
			if (err) reject(err);
			else
				resolve(
					getRecursiveBoxNames(boxes).map((box) => ({ name: box, id: box }))
				);
		});
	});
};

const getRecursiveBoxNames = (boxes: Imap.MailBoxes): string[] =>
	Object.keys(boxes).reduce((list, box) => {
		list.push(box);

		if (boxes[box].children) {
			const childBoxes = getRecursiveBoxNames(boxes[box].children).map(
				(name) => `${box}${boxes[box].delimiter}${name}`
			);
			list.push(...childBoxes);
		}

		return list;
	}, []);

import Imap from "imap";

import { BoxResponse } from "@dust-mail/typings";

import { Box } from "@mail/interfaces/client/incoming.interface";

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

export const getBoxes = async (_client: Imap): Promise<BoxResponse[]> => {
	return new Promise((resolve, reject) => {
		_client.getBoxes((err, boxes) => {
			if (err) reject(err);
			else
				resolve(
					getRecursiveBoxNames(boxes).map(({ id, delimiter }) => ({
						name: id,
						id,
						delimiter
					}))
				);
		});
	});
};

export const createBox = async (_client: Imap, boxID: string): Promise<void> =>
	await new Promise<void>((resolve, reject) =>
		_client.addBox(boxID, (error) => {
			if (error) reject(error);
			else resolve();
		})
	);

export const deleteBox = async (_client: Imap, boxID: string): Promise<void> =>
	await new Promise<void>((resolve, reject) =>
		_client.delBox(boxID, (error) => {
			if (error) reject(error);
			else resolve();
		})
	);

const getRecursiveBoxNames = (
	boxes: Imap.MailBoxes
): { id: string; delimiter: string }[] =>
	Object.keys(boxes).reduce((list, box) => {
		list.push({ id: box, delimiter: boxes[box].delimiter });

		if (boxes[box].children) {
			const childBoxes = getRecursiveBoxNames(boxes[box].children).map(
				({ id, delimiter }) => ({ id: `${box}${delimiter}${id}`, delimiter })
			);
			list.push(...childBoxes);
		}

		return list;
	}, []);

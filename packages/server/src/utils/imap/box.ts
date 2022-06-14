import Imap from "imap";

export const openBox = async (
	_client: Imap,
	name: string,
	readOnly?: boolean
): Promise<Imap.Box> => {
	return new Promise((resolve, reject) =>
		_client.openBox(name, readOnly ?? true, (err, box) => {
			if (box) resolve(box);
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

export const getBoxes = async (_client: Imap): Promise<string[]> => {
	return new Promise((resolve, reject) => {
		_client.getBoxes((err, boxes) => {
			if (err) reject(err);
			else resolve(getRecursiveBoxNames(boxes));
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

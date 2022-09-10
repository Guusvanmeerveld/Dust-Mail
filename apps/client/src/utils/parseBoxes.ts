import { BoxResponse } from "@dust-mail/typings";

import Box from "@interfaces/box";

const parseBoxes = (boxes: BoxResponse[]): Box[] => {
	let array: Box[] = boxes.map((i) => ({
		...i,
		children: []
	}));

	for (let i = 0; i < array.length; i++) {
		const element = array[i];

		const split = element.id.split(".");

		for (let i = 0; i < split.length - 1; i++) {
			let currentLayer = array;

			for (let i = 0; i < split.length - 1; i++) {
				const found = currentLayer.find(
					(item) => item.name == split[i]
				)?.children;

				if (found) currentLayer = found;
				else break;
			}

			const name = split[split.length - 1];

			if (currentLayer && !currentLayer.find((item) => item.name == name)) {
				currentLayer.push({
					...element,
					id: element.id,
					name
				});
			}
		}
	}

	array = array.filter((item) => item.id.indexOf(".") < 0);

	return array;
};

export default parseBoxes;

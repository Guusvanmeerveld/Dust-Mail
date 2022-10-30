import Box from "@interfaces/box";

/**
 * The opposite of `flattenBoxes.ts`
 *
 * Takes an array of flattened boxes with all of the items at the top level and nests all of the boxes into their corresponding parents.
 * @param boxes
 * @returns
 */
const nestBoxes = (boxes: Box[]): Box[] => {
	let array: Box[] = boxes.map((i) => ({
		...i,
		children: []
	}));

	for (let i = 0; i < array.length; i++) {
		const element = array[i];

		const split = element.id.split(element.delimiter);

		for (let i = 0; i < split.length - 1; i++) {
			let currentLayer = array;

			for (let i = 0; i < split.length - 1; i++) {
				const found = currentLayer.find(
					(item) => item.id == split[i]
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

	array = array.filter((item) => item.id.indexOf(item.delimiter) < 0);

	return array;
};

export default nestBoxes;

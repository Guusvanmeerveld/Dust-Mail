import Box from "@interfaces/box";

import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";

const flattenBoxesArray = (boxes: Box[]): Box[] =>
	boxes.reduce<any[]>((list, { name, id }) => {
		list.push({ name, id, ...findBoxInPrimaryBoxesList(name) });

		const currentBox = boxes.find((box) => box.name == name)?.children;

		if (currentBox) {
			const childBoxes = flattenBoxesArray(currentBox).map((child) => ({
				name: `${name} / ${child.name}`,
				id: child.id
			}));

			list.push(...childBoxes);
		}

		return list;
	}, []);

export default flattenBoxesArray;

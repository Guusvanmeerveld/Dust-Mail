import Box from "@interfaces/box";

// import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";

/**
 * The opposite of `nestBoxes.ts`
 *
 * Take an array of boxes that have `children` properties and flattens it so that there are no more children and all of the boxes are at the top level.
 * @param boxes - The unflattened array with nested children
 * @returns An array of boxes with all of the items at the top level
 */
const flattenBoxes = (boxes: Box[]): Box[] =>
	boxes.reduce<Box[]>((list, { name, ...box }) => {
		list.push({ name, ...box });

		const currentBox = boxes.find((box) => box.name == name)?.children;

		if (currentBox) {
			const childBoxes = flattenBoxes(currentBox).map((child) => ({
				...child,
				name: child.name
			}));

			list.push(...childBoxes);
		}

		return list;
	}, []);

export default flattenBoxes;

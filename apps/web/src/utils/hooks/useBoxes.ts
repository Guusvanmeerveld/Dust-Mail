import useLocalStorageState from "use-local-storage-state";

import Box from "@interfaces/box";

import flattenBoxes from "@utils/flattenBoxes";

const useBoxes = (): [flattenedBoxes: Box[], boxes: Box[]] | [] => {
	const [boxes] = useLocalStorageState<Box[]>("boxes");

	if (!boxes) return [];

	const flattenedBoxes = flattenBoxes(boxes);

	return [flattenedBoxes, boxes];
};

export default useBoxes;

import useLocalStorageState from "use-local-storage-state";

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Box from "@interfaces/box";

import flattenBoxes from "@utils/flattenBoxes";

const useSelectedBox = (): [Box | void, (boxID?: string) => void] => {
	const params = useParams<{ boxID: string }>();

	const [boxes] = useLocalStorageState<Box[]>("boxes");

	const navigate = useNavigate();

	const setSelectedBox = useMemo(
		() =>
			(boxID?: string): void =>
				navigate(`/dashboard/${encodeURIComponent(boxID ?? "")}`),
		[]
	);

	const flattenedBoxes = useMemo(() => {
		if (boxes) return flattenBoxes(boxes);
	}, [boxes]);

	return useMemo(() => {
		const boxID = params.boxID;

		if (boxID && flattenedBoxes) {
			const box = flattenedBoxes.find((item) => item.id == boxID);

			return [box, setSelectedBox];
		}

		return [, setSelectedBox];
	}, [params.boxID, flattenedBoxes]);
};

export default useSelectedBox;

import useBoxes from "./useBoxes";

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Box from "@interfaces/box";

const useSelectedBox = (): [Box | void, (boxID?: string) => void] => {
	const params = useParams<{ boxID: string }>();

	const [flattenedBoxes] = useBoxes();

	const navigate = useNavigate();

	const setSelectedBox = useMemo(
		() =>
			(boxID?: string): void =>
				navigate(`/dashboard/${encodeURIComponent(boxID ?? "")}`),
		[]
	);

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

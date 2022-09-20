import useLocalStorageState from "use-local-storage-state";

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Box from "@interfaces/box";

const useSelectedBox = (): [Box | void, (boxID?: Box) => void] => {
	const params = useParams<{ boxID: string }>();

	const [boxes] = useLocalStorageState<{ name: string; id: string }[]>("boxes");

	const navigate = useNavigate();

	const setSelectedBox = useMemo(
		() =>
			(box?: Box): void =>
				navigate(`/dashboard/${encodeURIComponent(box?.id ?? "")}`),
		[]
	);

	return useMemo(() => {
		const boxID = params.boxID;

		if (boxID) {
			const boxName = boxes?.find((box) => boxID == box.id)?.name;

			return [
				{
					name: boxName ?? boxID,
					id: boxID
				},
				setSelectedBox
			];
		}

		return [, setSelectedBox];
	}, [params.boxID, boxes]);
};

export default useSelectedBox;

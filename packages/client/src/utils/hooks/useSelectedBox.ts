import useLocalStorageState from "use-local-storage-state";

import { useNavigate, useParams } from "react-router-dom";

import { useMemo } from "preact/hooks";

import Box from "@interfaces/box";

import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";

const useSelectedBox = (): [Box | void, (boxID?: Box) => void] => {
	const params = useParams<{ boxID: string }>();

	const [boxes] = useLocalStorageState<{ name: string; id: string }[]>("boxes");

	const navigate = useNavigate();

	return useMemo(() => {
		const boxID = params.boxID;

		const setSelectedBox = (box?: Box) =>
			navigate(`/dashboard/${box?.id ?? ""}`);

		if (boxID) {
			const boxName = boxes?.find((box) => boxID == box.id)?.name;

			if (boxName) {
				const isPrimaryBox = findBoxInPrimaryBoxesList(boxName);

				if (isPrimaryBox) {
					return [{ ...isPrimaryBox, id: boxID }, setSelectedBox];
				}
			}

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

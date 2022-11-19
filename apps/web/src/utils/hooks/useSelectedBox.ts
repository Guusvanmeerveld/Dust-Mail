import useSelectedStore from "./useSelected";
import useUser from "./useUser";

import { useMemo } from "react";

import Box from "@interfaces/box";

type UseSelectedBox = [Box | void, (boxID?: string) => void];

export const useSetSelectedBox = (): ((id?: string) => void) => {
	const setSelectedBox = useSelectedStore((state) => state.setSelectedBox);

	return setSelectedBox;
};

const useSelectedBox = (): UseSelectedBox => {
	const setSelectedBox = useSetSelectedBox();
	const boxID = useSelectedStore((state) => state.selectedBox);

	const user = useUser();

	const selectedBox: UseSelectedBox = useMemo(() => {
		if (boxID && user?.boxes.flattened) {
			const box = user.boxes.flattened.find((item) => item.id == boxID);

			return [box, setSelectedBox];
		}

		return [, setSelectedBox];
	}, [boxID, setSelectedBox, user?.boxes.flattened]);

	return selectedBox;
};

export default useSelectedBox;

import useUser from "./useUser";

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Box from "@interfaces/box";

const useSelectedBox = (): [Box | void, (boxID?: string) => void] => {
	const params = useParams<{ boxID: string }>();

	const { user } = useUser();

	const navigate = useNavigate();

	const boxID = params.boxID;

	const setSelectedBox = useMemo(
		() =>
			(id?: string): void =>
				navigate(`/dashboard/${encodeURIComponent(id ?? "")}`),
		[]
	);

	return useMemo(() => {
		if (boxID && user?.boxes.flattened) {
			const box = user.boxes.flattened.find((item) => item.id == boxID);

			return [box, setSelectedBox];
		}

		return [, setSelectedBox];
	}, [boxID, setSelectedBox, user?.boxes.flattened]);
};

export default useSelectedBox;

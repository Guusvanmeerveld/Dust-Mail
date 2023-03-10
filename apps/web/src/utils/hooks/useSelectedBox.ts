import useMailClient from "./useMailClient";
import useSelectedStore from "./useSelected";

import { useMemo } from "react";
import { useQuery } from "react-query";

import { AppError, MailBox } from "@dust-mail/structures";

import Box from "@interfaces/box";

import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";
import {
	createBaseError,
	createErrorFromUnknown,
	errorToString
} from "@utils/parseError";

interface UseSelectedBox {
	box: Box | null;
	error: string | null;
	setSelectedBox: (boxID?: string) => void;
}

export const useSetSelectedBox = (): ((id?: string) => void) => {
	const setSelectedBox = useSelectedStore((state) => state.setSelectedBox);

	return setSelectedBox;
};

const defaultBox: (boxId: string) => Box = (boxId) => ({
	children: [],
	counts: null,
	delimiter: null,
	id: boxId,
	selectable: true,
	name: ""
});

const useSelectedBox = (): UseSelectedBox => {
	const setSelectedBox = useSetSelectedBox();

	const boxId = useSelectedStore((state) => state.selectedBox);

	const mailClient = useMailClient();

	const { data, error } = useQuery<MailBox, AppError>(
		["box", boxId],
		async () => {
			const result = await mailClient
				.get(boxId)
				.catch((error) => createBaseError(createErrorFromUnknown(error)));

			if (result.ok) return result.data;
			else throw result.error;
		},
		{
			enabled: boxId !== undefined
		}
	);

	const selectedBox: UseSelectedBox = useMemo(() => {
		const primaryBoxData = data
			? findBoxInPrimaryBoxesList(data.id)
			: undefined;

		return {
			box: boxId
				? data
					? { ...data, icon: primaryBoxData?.icon }
					: defaultBox(boxId)
				: null,
			error: error ? errorToString(error) : null,
			setSelectedBox
		};
	}, [data, error, setSelectedBox]);

	return selectedBox;
};

export default useSelectedBox;

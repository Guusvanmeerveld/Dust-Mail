import z from "zod";

import useMailClient from "./useMailClient";
import useSelectedStore from "./useSelected";

import { useMemo } from "react";
import { useQuery } from "react-query";

import { Error } from "@models/error";
import { MailBox } from "@models/mailbox";

import Box from "@interfaces/box";

import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";
import { errorToString } from "@utils/parseError";

interface UseSelectedBox {
	box: Box | void;
	error: string | void;
	setSelectedBox: (boxID?: string) => void;
}

export const useSetSelectedBox = (): ((id?: string) => void) => {
	const setSelectedBox = useSelectedStore((state) => state.setSelectedBox);

	return setSelectedBox;
};

const useSelectedBox = (): UseSelectedBox => {
	const setSelectedBox = useSetSelectedBox();

	const boxID = useSelectedStore((state) => state.selectedBox);

	const mailClient = useMailClient();

	const { data, error } = useQuery<
		z.infer<typeof MailBox>,
		z.infer<typeof Error>
	>(["box", boxID], () => mailClient.get(boxID), {
		enabled: boxID != undefined
	});

	const selectedBox: UseSelectedBox = useMemo(() => {
		const primaryBoxData = data
			? findBoxInPrimaryBoxesList(data.id)
			: undefined;

		return {
			box: data ? { ...data, icon: primaryBoxData?.icon } : undefined,
			error: error ? errorToString(error) : undefined,
			setSelectedBox
		};
	}, [data, error, setSelectedBox]);

	return selectedBox;
};

export default useSelectedBox;

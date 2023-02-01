import useLocalStorageState from "use-local-storage-state";

import useSelectedStore from "./useSelected";
import useUser from "./useUser";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "react-query";

import { AxiosError } from "axios";

import { ErrorResponse, FullIncomingMessage } from "@dust-mail/typings";

import useFetch from "@utils/hooks/useFetch";
import useSelectedBox from "@utils/hooks/useSelectedBox";
import useStore from "@utils/hooks/useStore";

interface UseSelectedMessage {
	selectedMessage: FullIncomingMessage | undefined;
	selectedMessageError: AxiosError<ErrorResponse> | null;
	selectedMessageFetching: boolean;
}

export const useSetSelectedMessage = (): ((id?: string) => void) => {
	const setSelectedMessage = useSelectedStore(
		(state) => state.setSelectedMessage
	);

	return setSelectedMessage;
};

const useSelectedMessage = (): UseSelectedMessage => {
	const { box: selectedBox } = useSelectedBox();

	const fetcher = useFetch();

	const setFetching = useStore((state) => state.setFetching);

	const user = useUser();

	const [darkMode] = useLocalStorageState<boolean>("messageDarkMode", {
		defaultValue: false
	});

	const [showImages] = useLocalStorageState<boolean>("showImages", {
		defaultValue: false
	});

	const messageID = useSelectedStore((state) => state.selectedMessage);

	const { data, isFetching, error } = useQuery<
		FullIncomingMessage | undefined,
		AxiosError<ErrorResponse>
	>(
		["message", messageID, selectedBox?.id, showImages, darkMode, user?.token],
		() => {
			return fetcher.getMessage(
				!showImages,
				darkMode,
				messageID,
				selectedBox?.id
			);
		},
		{
			enabled:
				messageID != undefined &&
				selectedBox?.id != undefined &&
				user?.token != undefined
		}
	);

	useEffect(() => setFetching(isFetching), [isFetching]);

	const returnable = useMemo(
		() => ({
			selectedMessage: messageID
				? data ?? {
						id: messageID,
						box: { id: "" },
						content: {},
						date: new Date(),
						flags: { seen: false },
						from: []
				  }
				: undefined,
			selectedMessageError: error,
			selectedMessageFetching: isFetching
		}),
		[data, error, isFetching]
	);

	return returnable;
};

export default useSelectedMessage;

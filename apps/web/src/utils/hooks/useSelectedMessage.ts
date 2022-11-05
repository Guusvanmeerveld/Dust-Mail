import useLocalStorageState from "use-local-storage-state";

import useUser from "./useUser";

import { useEffect, useMemo } from "react";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";

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
	const navigate = useNavigate();

	const [selectedBox] = useSelectedBox();

	const setSelectedMessage = useMemo(
		() =>
			(id?: string): void =>
				navigate(`/dashboard/${selectedBox?.id}${id ? `/${id}` : ""}`),
		[selectedBox]
	);

	return setSelectedMessage;
};

const useSelectedMessage = (): UseSelectedMessage => {
	const [selectedBox] = useSelectedBox();

	const fetcher = useFetch();

	const params = useParams<{ messageID: string }>();

	const setFetching = useStore((state) => state.setFetching);

	const { user } = useUser();

	const [darkMode] = useLocalStorageState<boolean>("messageDarkMode", {
		defaultValue: false
	});

	const [showImages] = useLocalStorageState<boolean>("showImages", {
		defaultValue: false
	});

	const messageID = params.messageID;

	// eslint-disable-next-line prefer-const
	let { data, isFetching, error } = useQuery<
		FullIncomingMessage | undefined,
		AxiosError<ErrorResponse>
	>(
		[
			"message",
			messageID,
			selectedBox?.id,
			showImages,
			darkMode,
			user?.accessToken?.body
		],
		() => {
			if (!user?.accessToken?.body) return undefined;
			else
				return fetcher.getMessage(
					!showImages,
					darkMode,
					messageID,
					selectedBox?.id
				);
		},
		{ enabled: messageID != undefined }
	);

	useEffect(() => setFetching(isFetching), [isFetching]);

	if (!data && messageID) {
		data = {
			id: messageID,
			box: { id: "" },
			content: {},
			date: new Date(),
			flags: { seen: false },
			from: []
		};
	}

	const returnable = useMemo(
		() => ({
			selectedMessage: data,
			selectedMessageError: error,
			selectedMessageFetching: isFetching
		}),
		[data, error, isFetching]
	);

	return returnable;
};

export default useSelectedMessage;

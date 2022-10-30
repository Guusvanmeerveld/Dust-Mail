import useLocalStorageState from "use-local-storage-state";

import { useEffect, useMemo } from "react";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";

import { FullIncomingMessage, LocalToken } from "@dust-mail/typings";

import useFetch from "@utils/hooks/useFetch";
import useSelectedBox from "@utils/hooks/useSelectedBox";
import useStore from "@utils/hooks/useStore";

interface UseSelectedMessage {
	selectedMessage: FullIncomingMessage | undefined;
	selectedMessageError: string | null;
	setSelectedMessage: (id?: string) => void;
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

	const setSelectedMessage = useSetSelectedMessage();

	const fetcher = useFetch();

	const params = useParams<{ messageID: string }>();

	const setFetching = useStore((state) => state.setFetching);

	const [token] = useLocalStorageState<LocalToken>("accessToken");

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
		string
	>(
		["message", messageID, selectedBox?.id, showImages, darkMode, token?.body],
		() => {
			if (!token?.body) return undefined;
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
			setSelectedMessage
		}),
		[data, error, setSelectedMessage]
	);

	return returnable;
};

export default useSelectedMessage;

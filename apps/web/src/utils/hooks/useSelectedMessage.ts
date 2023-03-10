// import useLocalStorageState from "use-local-storage-state";
import useMailClient from "./useMailClient";
import useSelectedStore from "./useSelected";
import useUser from "./useUser";

import { useEffect, useMemo } from "react";
import { useQuery } from "react-query";

import { AppError, Message } from "@dust-mail/structures";

import useSelectedBox from "@utils/hooks/useSelectedBox";
import useStore from "@utils/hooks/useStore";
import { createResultFromUnknown } from "@utils/parseError";

interface UseSelectedMessage {
	selectedMessage: Message | undefined;
	selectedMessageError: AppError | null;
	selectedMessageFetching: boolean;
}

export const useSetSelectedMessage = (): ((id?: string) => void) => {
	const setSelectedMessage = useSelectedStore(
		(state) => state.setSelectedMessage
	);

	return setSelectedMessage;
};

const defaultMessage: (messageId: string) => Message = (messageId) => ({
	id: messageId,
	bcc: [],
	cc: [],
	to: [],
	headers: {},
	subject: null,
	content: { html: null, text: null },
	sent: Date.now(),
	flags: ["Read"],
	from: []
});

const useSelectedMessage = (): UseSelectedMessage => {
	const { box: selectedBox } = useSelectedBox();

	const mailClient = useMailClient();

	const setFetching = useStore((state) => state.setFetching);

	const user = useUser();

	// const [darkMode] = useLocalStorageState<boolean>("messageDarkMode", {
	// 	defaultValue: false
	// });

	// const [showImages] = useLocalStorageState<boolean>("showImages", {
	// 	defaultValue: false
	// });

	const messageId = useSelectedStore((state) => state.selectedMessage);

	const { data, isFetching, error } = useQuery<Message, AppError>(
		["message", messageId, selectedBox?.id],
		async () => {
			const result = await mailClient
				.getMessage(messageId, selectedBox?.id)
				.catch(createResultFromUnknown);

			if (result.ok) return result.data;
			else throw result.error;
		},
		{
			enabled:
				messageId != undefined &&
				selectedBox?.id != undefined &&
				selectedBox.selectable &&
				user?.token != undefined
		}
	);

	useEffect(() => setFetching(isFetching), [isFetching]);

	return useMemo(
		() => ({
			selectedMessage: messageId
				? data ?? defaultMessage(messageId)
				: undefined,
			selectedMessageError: error,
			selectedMessageFetching: isFetching
		}),
		[data, error, isFetching]
	);
};

export default useSelectedMessage;

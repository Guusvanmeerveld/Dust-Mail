import { useNavigate, useParams } from "react-router-dom";

import { useMemo } from "preact/hooks";

import useSelectedBox from "@utils/hooks/useSelectedBox";

const useSelectedMessage = (): [
	string | void,
	(messageID?: string) => void
] => {
	const [selectedBox] = useSelectedBox();

	const params = useParams<{ messageID: string }>();

	const navigate = useNavigate();

	return useMemo(() => {
		const messageID = params.messageID;

		const setSelectedMessage = (messageID?: string): void =>
			navigate(
				`/dashboard/${selectedBox?.id}${messageID ? `/${messageID}` : ""}`
			);

		if (messageID) {
			return [messageID, setSelectedMessage];
		}

		return [, setSelectedMessage];
	}, [params.messageID, selectedBox?.id]);
};

export default useSelectedMessage;

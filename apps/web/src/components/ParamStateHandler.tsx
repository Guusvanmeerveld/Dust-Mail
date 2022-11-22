import { FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

import useSelectedStore from "@utils/hooks/useSelected";
import useUser from "@utils/hooks/useUser";

const ParamStateHandler: FC = () => {
	const navigate = useNavigate();

	const setSelectedBox = useSelectedStore((state) => state.setSelectedBox);
	const setSelectedMessage = useSelectedStore(
		(state) => state.setSelectedMessage
	);

	const user = useUser();

	const selectedBox = useSelectedStore((state) => state.selectedBox);
	const selectedMessage = useSelectedStore((state) => state.selectedMessage);

	const { boxID, messageID } = useParams<{
		boxID: string;
		messageID: string;
	}>();

	useEffect(() => {
		if (boxID) setSelectedBox(boxID);
		if (messageID) setSelectedMessage(messageID);
	}, []);

	useEffect(() => {
		if (user) {
			if (selectedBox) {
				const box = encodeURIComponent(selectedBox);

				if (!selectedMessage) navigate(`/dashboard/${box}`);

				if (selectedMessage) {
					const message = encodeURIComponent(selectedMessage);

					navigate(`/dashboard/${box}/${message}`);
				}
			} else if (!selectedBox && !selectedMessage) navigate(`/dashboard`);
		}
	}, [selectedMessage, selectedBox]);

	return <></>;
};

export default ParamStateHandler;

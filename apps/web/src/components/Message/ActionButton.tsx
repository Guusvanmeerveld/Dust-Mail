import { FC } from "react";

import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";

import useMessageActions from "@utils/hooks/useMessageActions";
import useSelectedMessage from "@utils/hooks/useSelectedMessage";

const MessageActionButton: FC = () => {
	const { selectedMessage } = useSelectedMessage();

	const actions = useMessageActions();

	if (selectedMessage)
		return (
			<SpeedDial
				ariaLabel="Message actions"
				sx={{
					position: "absolute",
					bottom: 16,
					right: 16,
					display: { md: "none" }
				}}
				icon={<SpeedDialIcon />}
			>
				{actions.reverse().map((action) => (
					<SpeedDialAction
						onClick={() => action.handler(selectedMessage)}
						key={action.name}
						icon={action.icon}
						tooltipTitle={action.name}
					/>
				))}
			</SpeedDial>
		);

	return <></>;
};

export default MessageActionButton;

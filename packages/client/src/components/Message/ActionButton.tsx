import { FunctionalComponent } from "preact";

import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";

import useMessageActions from "@utils/hooks/useMessageActions";
import useSelectedMessage from "@utils/hooks/useSelectedMessage";

const MessageActionButton: FunctionalComponent = () => {
	const [selectedMessage] = useSelectedMessage();

	const actions = useMessageActions(selectedMessage!);

	if (selectedMessage)
		return (
			<SpeedDial
				ariaLabel="Message actions"
				sx={{ position: "absolute", bottom: 16, right: 16 }}
				icon={<SpeedDialIcon />}
			>
				{actions.reverse().map((action) => (
					<SpeedDialAction
						onClick={action.handler}
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

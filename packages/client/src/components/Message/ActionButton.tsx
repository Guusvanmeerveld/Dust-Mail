import { FunctionalComponent } from "preact";

import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";

import useMessageActions from "@utils/hooks/useMessageActions";
import useStore from "@utils/hooks/useStore";

const MessageActionButton: FunctionalComponent = () => {
	const selectedMessage = useStore((state) => state.selectedMessage);

	const actions = useMessageActions(selectedMessage?.id!);

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

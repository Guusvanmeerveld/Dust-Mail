import useSnackbar from "./useSnackbar";

import DeleteIcon from "@mui/icons-material/Delete";
import FolderMoveIcon from "@mui/icons-material/DriveFileMove";
import ForwardIcon from "@mui/icons-material/Forward";
import DetailsIcon from "@mui/icons-material/Info";
import ReplyIcon from "@mui/icons-material/Reply";

import MessageAction from "@interfaces/messageAction";

const useMessageActions = (): MessageAction[] => {
	const showSnackbar = useSnackbar();

	const actions: MessageAction[] = [
		{
			name: "Move message",
			icon: <FolderMoveIcon />,
			handler: (message) => console.log(message?.id)
		},
		{
			name: "Forward message",
			icon: <ForwardIcon />,
			handler: () => showSnackbar("yeet")
		},
		{
			name: "Reply",
			icon: <ReplyIcon />,
			handler: () => null
		},
		{ name: "Delete message", icon: <DeleteIcon />, handler: () => null },
		{ name: "Show details", icon: <DetailsIcon />, handler: () => null }
	];

	return actions;
};

export default useMessageActions;

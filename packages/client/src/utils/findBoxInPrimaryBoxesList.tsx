import Archive from "@mui/icons-material/Archive";
import ChangeCircle from "@mui/icons-material/ChangeCircle";
import Dangerous from "@mui/icons-material/Dangerous";
import Delete from "@mui/icons-material/Delete";
import Drafts from "@mui/icons-material/Drafts";
import Inbox from "@mui/icons-material/Inbox";
import Send from "@mui/icons-material/Send";

const DEFAULT_PRIMARY_BOXES: { name: string; icon: JSX.Element }[] = [
	{ name: "Inbox", icon: <Inbox /> },
	{ name: "Sent", icon: <Send /> },
	{ name: "Drafts", icon: <Drafts /> },
	{ name: "Spam", icon: <Dangerous /> },
	{ name: "Trash", icon: <Delete /> },
	{ name: "Archive", icon: <Archive /> },
	{ name: "Junk", icon: <ChangeCircle /> }
];

const findBoxInPrimaryBoxesList = (
	name: string
):
	| {
			name: string;
			icon: JSX.Element;
			// eslint-disable-next-line no-mixed-spaces-and-tabs
	  }
	| undefined =>
	DEFAULT_PRIMARY_BOXES.find(
		(box) => box.name.toLowerCase() == name.toLowerCase()
	);

export default findBoxInPrimaryBoxesList;

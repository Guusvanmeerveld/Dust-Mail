import Archive from "@mui/icons-material/Archive";
import ChangeCircle from "@mui/icons-material/ChangeCircle";
import Dangerous from "@mui/icons-material/Dangerous";
import Delete from "@mui/icons-material/Delete";
import Drafts from "@mui/icons-material/Drafts";
import Forum from "@mui/icons-material/Forum";
import Inbox from "@mui/icons-material/Inbox";
import Unread from "@mui/icons-material/MarkEmailUnread";
import People from "@mui/icons-material/People";
import Person from "@mui/icons-material/Person";
import Promotions from "@mui/icons-material/Recommend";
import Send from "@mui/icons-material/Send";
import Star from "@mui/icons-material/Star";
import Updates from "@mui/icons-material/TipsAndUpdates";

interface Box {
	id: string;
	name: string;
	icon: JSX.Element;
}

const DEFAULT_PRIMARY_BOXES: Box[] = [
	{ name: "Inbox", id: "INBOX", icon: <Inbox /> },
	{ name: "Sent", id: "Sent", icon: <Send /> },
	{ name: "Drafts", id: "Drafts", icon: <Drafts /> },
	{ name: "Drafts", id: "Draft", icon: <Drafts /> },
	{ name: "Starred", id: "STARRED", icon: <Star /> },
	{ name: "Unread", id: "UNREAD", icon: <Unread /> },
	{ name: "Spam", id: "Spam", icon: <Dangerous /> },
	{ name: "Trash", id: "Trash", icon: <Delete /> },
	{ name: "Archive", id: "Archive", icon: <Archive /> },
	{ name: "Junk", id: "Junk", icon: <ChangeCircle /> },
	{ name: "Forums", id: "CATEGORY_FORUMS", icon: <Forum /> },
	{ name: "Personal", id: "CATEGORY_PERSONAL", icon: <Person /> },
	{ name: "Promotions", id: "CATEGORY_PROMOTIONS", icon: <Promotions /> },
	{ name: "Social", id: "CATEGORY_SOCIAL", icon: <People /> },
	{ name: "Updates", id: "CATEGORY_UPDATES", icon: <Updates /> }
];

const findBoxInPrimaryBoxesList = (id: string): Box | undefined =>
	DEFAULT_PRIMARY_BOXES.find((box) => box.id.toLowerCase() == id.toLowerCase());

export default findBoxInPrimaryBoxesList;

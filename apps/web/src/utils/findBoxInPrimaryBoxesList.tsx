import Archive from "@mui/icons-material/Archive";
import ChangeCircle from "@mui/icons-material/ChangeCircle";
import Dangerous from "@mui/icons-material/Dangerous";
import Delete from "@mui/icons-material/Delete";
import Drafts from "@mui/icons-material/Drafts";
import Forum from "@mui/icons-material/Forum";
import Google from "@mui/icons-material/Google";
import Inbox from "@mui/icons-material/Inbox";
import Unread from "@mui/icons-material/MarkEmailUnread";
import People from "@mui/icons-material/People";
import Person from "@mui/icons-material/Person";
import Promotions from "@mui/icons-material/Recommend";
import Schedule from "@mui/icons-material/Schedule";
import Send from "@mui/icons-material/Send";
import Star from "@mui/icons-material/Star";
import Updates from "@mui/icons-material/TipsAndUpdates";

const DEFAULT_PRIMARY_BOXES: {
	id: string[] | string;
	name: string;
	icon: JSX.Element;
}[] = [
	{ name: "Inbox", id: "INBOX", icon: <Inbox /> },
	{ name: "Sent", id: "Sent", icon: <Send /> },
	{ name: "Drafts", id: ["Drafts", "Draft"], icon: <Drafts /> },
	{ name: "Starred", id: "STARRED", icon: <Star /> },
	{ name: "Unread", id: "UNREAD", icon: <Unread /> },
	{ name: "Spam", id: "Spam", icon: <Dangerous /> },
	{ name: "Trash", id: ["Trash", "Deleted"], icon: <Delete /> },
	{ name: "Scheduled", id: "Scheduled", icon: <Schedule /> },
	{ name: "Archive", id: "Archive", icon: <Archive /> },
	{ name: "Junk", id: "Junk", icon: <ChangeCircle /> },
	{ name: "Forums", id: "CATEGORY_FORUMS", icon: <Forum /> },
	{ name: "Personal", id: ["CATEGORY_PERSONAL", "Personal"], icon: <Person /> },
	{ name: "Promotions", id: "CATEGORY_PROMOTIONS", icon: <Promotions /> },
	{ name: "Social", id: "CATEGORY_SOCIAL", icon: <People /> },
	{ name: "Updates", id: "CATEGORY_UPDATES", icon: <Updates /> },
	{ name: "Gmail", id: ["[Gmail]", "Gmail"], icon: <Google /> }
];

interface PrimaryBox {
	name: string;
	id: string[] | string;
	icon: JSX.Element;
}

const findBoxInPrimaryBoxesList = (
	id: string
): (Omit<PrimaryBox, "id"> & { id: string }) | undefined => {
	const foundBox = DEFAULT_PRIMARY_BOXES.find((box) => {
		if (Array.isArray(box.id)) {
			const found = box.id.find(
				(item) => item.toLowerCase() == id.toLowerCase()
			);

			return found != undefined;
		} else return box.id.toLowerCase() == id.toLowerCase();
	});

	if (foundBox) return { ...foundBox, id };
};

export default findBoxInPrimaryBoxesList;

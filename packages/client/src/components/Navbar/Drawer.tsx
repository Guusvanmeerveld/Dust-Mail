import useLocalStorageState from "use-local-storage-state";

import { FunctionalComponent, JSX } from "preact";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import MUIDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import Archive from "@mui/icons-material/Archive";
import ChangeCircle from "@mui/icons-material/ChangeCircle";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import Dangerous from "@mui/icons-material/Dangerous";
import Delete from "@mui/icons-material/Delete";
import Drafts from "@mui/icons-material/Drafts";
import Folder from "@mui/icons-material/Folder";
import Inbox from "@mui/icons-material/Inbox";
import Send from "@mui/icons-material/Send";

import MailBox from "@interfaces/box";

import useStore from "@utils/createStore";
import useTheme from "@utils/hooks/useTheme";

const DEFAULT_PRIMARY_BOXES: { name: string; icon: JSX.Element }[] = [
	{ name: "Inbox", icon: <Inbox /> },
	{ name: "Sent", icon: <Send /> },
	{ name: "Drafts", icon: <Drafts /> },
	{ name: "Spam", icon: <Dangerous /> },
	{ name: "Trash", icon: <Delete /> },
	{ name: "Archive", icon: <Archive /> },
	{ name: "Junk", icon: <ChangeCircle /> }
];

const Drawer: FunctionalComponent<{
	toggleDrawer: (open: boolean) => (event: KeyboardEvent | MouseEvent) => void;
	drawerState: boolean;
}> = ({ toggleDrawer, drawerState }) => {
	const [boxes] = useLocalStorageState<string[]>("boxes");

	const theme = useTheme();

	const currentBox = useStore((state) => state.currentBox);
	const setCurrentBox = useStore((state) => state.setCurrentBox);

	const findBoxInPrimaryBoxesList = (item: string) =>
		DEFAULT_PRIMARY_BOXES.find(
			(box) => box.name.toLocaleLowerCase() == item.toLocaleLowerCase()
		);

	// Find all of the primary boxes and sort them alphabetically
	const primaryBoxes: MailBox[] | undefined = boxes
		?.filter(findBoxInPrimaryBoxesList)
		.sort((a, b) => a.localeCompare(b))
		.map((i) => {
			const found = findBoxInPrimaryBoxesList(i);

			return { ...found!, id: i };
		});

	// Find all of the other boxes and sort them alphabetically
	const otherBoxes: MailBox[] | undefined = boxes
		?.filter((i) => !findBoxInPrimaryBoxesList(i))
		.sort((a, b) => a.localeCompare(b))
		.map((i) => ({ name: i, id: i }));

	const createFolderTree = (boxes: MailBox[]) =>
		boxes.map((box) => (
			<ListItem selected={box.id == currentBox} disablePadding>
				<ListItemButton
					onClick={(e: MouseEvent) => {
						setCurrentBox(box.id);
						toggleDrawer(false)(e);
					}}
				>
					<ListItemIcon>{box.icon ?? <Folder />}</ListItemIcon>
					<ListItemText primary={box.name} />
				</ListItemButton>
			</ListItem>
		));

	return (
		<MUIDrawer
			anchor="left"
			sx={{ p: 2 }}
			open={drawerState}
			onClose={toggleDrawer(false)}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "flex-end",
					padding: theme.spacing(0, 1),
					...theme.mixins.toolbar
				}}
			>
				<IconButton onClick={toggleDrawer(false)}>
					<ChevronLeft />
				</IconButton>
			</Box>
			<Divider />
			{primaryBoxes && createFolderTree(primaryBoxes)}
			{primaryBoxes && <Divider />}
			{otherBoxes && createFolderTree(otherBoxes)}
		</MUIDrawer>
	);
};

export default Drawer;

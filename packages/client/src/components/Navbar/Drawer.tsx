import useLocalStorageState from "use-local-storage-state";

import { FunctionalComponent } from "preact";

import { useEffect } from "preact/hooks";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import MUIDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import FolderIcon from "@mui/icons-material/Folder";

import MailBox from "@interfaces/box";

import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

const Drawer: FunctionalComponent<{
	toggleDrawer: (open: boolean) => (event: KeyboardEvent | MouseEvent) => void;
	drawerState: boolean;
}> = ({ toggleDrawer, drawerState }) => {
	const [boxes] = useLocalStorageState<string[]>("boxes");

	const theme = useTheme();

	const selectedBox = useStore((state) => state.selectedBox);
	const setSelectedBox = useStore((state) => state.setSelectedBox);

	const [defaultBox] = useLocalStorageState("defaultBox", {
		defaultValue: "INBOX"
	});

	useEffect(() => {
		const box = findBoxInPrimaryBoxesList(defaultBox);

		if (box) setSelectedBox({ ...box, id: box.name });
		else setSelectedBox({ id: defaultBox, name: defaultBox });
	}, []);

	useEffect(() => {
		if (selectedBox)
			document.title = `${import.meta.env.VITE_APP_NAME} - ${selectedBox.name}`;
	}, [selectedBox?.name]);

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

	const switchBox = (e: MouseEvent, box: MailBox) => {
		setSelectedBox(box);

		toggleDrawer(false)(e);
	};

	const createFolderTree = (boxes: MailBox[]) =>
		boxes.map((box) => (
			<ListItem selected={box.id == selectedBox?.id} disablePadding>
				<ListItemButton onClick={(e: MouseEvent) => switchBox(e, box)}>
					<ListItemIcon>{box.icon ?? <FolderIcon />}</ListItemIcon>
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
					<ChevronLeftIcon />
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

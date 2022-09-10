import useLocalStorageState from "use-local-storage-state";

import { useEffect, useMemo, memo, FC, useState } from "react";

import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import MUIListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/Add";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";

import MailBox from "@interfaces/box";

import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";
import useSelectedBox from "@utils/hooks/useSelectedBox";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

import AddBox from "@components/Boxes/Add";

const UnMemoizedBoxesList: FC = () => {
	const [boxes] = useLocalStorageState<{ name: string; id: string }[]>("boxes");

	const [selectedBox] = useSelectedBox();

	const showAddBox = useStore((state) => state.showAddBox);
	const setShowAddBox = useStore((state) => state.setShowAddBox);

	useEffect(() => {
		if (selectedBox) {
			const name = selectedBox.name ?? selectedBox.id;

			document.title = `${import.meta.env.VITE_APP_NAME}${
				name ? ` - ${name}` : ""
			}`;
		}
	}, [selectedBox]);

	// Find all of the primary boxes and sort them alphabetically
	const primaryBoxes: MailBox[] | undefined = useMemo(
		() =>
			boxes
				?.filter((box) => findBoxInPrimaryBoxesList(box.name))
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((box) => {
					const found = findBoxInPrimaryBoxesList(box.name);

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					return { ...box, ...found! };
				}),
		[boxes]
	);

	// Find all of the other boxes and sort them alphabetically
	const otherBoxes: MailBox[] | undefined = useMemo(
		() =>
			boxes
				?.filter((box) => !findBoxInPrimaryBoxesList(box.name))
				.sort((a, b) => a.name.localeCompare(b.name)),
		[boxes]
	);

	return (
		<>
			{showAddBox && <AddBox />}
			<Stack
				sx={{ padding: 1 }}
				direction="row"
				alignItems="center"
				justifyContent="right"
			>
				<IconButton onClick={() => setShowAddBox(true)}>
					<Tooltip title="Add new folder">
						<AddIcon />
					</Tooltip>
				</IconButton>
			</Stack>
			{(primaryBoxes || otherBoxes) && <Divider />}
			{primaryBoxes && <FolderTree boxes={primaryBoxes} />}
			{primaryBoxes && <Divider />}
			{otherBoxes && <FolderTree boxes={otherBoxes} />}
		</>
	);
};

const FolderTree: FC<{ boxes: MailBox[] }> = ({ boxes }) => (
	<List>
		{boxes.map((box) => (
			<ListItem key={box.id} box={box} />
		))}
	</List>
);

const ListItem: FC<{ box: MailBox }> = ({ box }) => {
	const [selectedBox, setSelectedBox] = useSelectedBox();

	const [isOpen, setOpen] = useState(false);

	const theme = useTheme();

	const switchBox = (box: MailBox): void => {
		setSelectedBox(box);
	};

	const indent = theme.spacing(box.id.split(".").length);

	return (
		<>
			{box.children && box.children.length != 0 && (
				<>
					<ListItemButton
						onClick={() => switchBox(box)}
						selected={box.id == selectedBox?.id}
						sx={{ pl: indent }}
					>
						<ListItemIcon>{box.icon ?? <FolderIcon />}</ListItemIcon>
						<ListItemText>
							<Typography noWrap textOverflow="ellipsis">
								{box.name}
							</Typography>
						</ListItemText>
						<IconButton onClick={() => setOpen((state) => !state)}>
							{isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
						</IconButton>
					</ListItemButton>
					<Collapse in={isOpen} timeout="auto" unmountOnExit>
						<List component="div" disablePadding>
							{box.children.map((box) => (
								<ListItem key={box.id} box={box} />
							))}
						</List>
					</Collapse>
				</>
			)}
			{(!box.children || (box.children && box.children.length == 0)) && (
				<MUIListItem selected={box.id == selectedBox?.id} disablePadding>
					<ListItemButton sx={{ pl: indent }} onClick={() => switchBox(box)}>
						<ListItemIcon>{box.icon ?? <FolderIcon />}</ListItemIcon>
						<ListItemText>
							<Typography noWrap textOverflow="ellipsis">
								{box.name}
							</Typography>
						</ListItemText>
					</ListItemButton>
				</MUIListItem>
			)}
		</>
	);
};

const BoxesList = memo(UnMemoizedBoxesList);

export default BoxesList;

import useLocalStorageState from "use-local-storage-state";
import create from "zustand";

import { useEffect, useMemo, memo, FC, useState } from "react";

// import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
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
import CheckBoxIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";

import MailBox from "@interfaces/box";

import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";
import useSelectedBox from "@utils/hooks/useSelectedBox";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

import AddBox from "@components/Boxes/Add";

type Store = {
	showSelector: boolean;
	setShowSelector: (show: boolean) => void;
	selectedBoxes: MailBox[];
	addSelectedBox: (box: MailBox) => void;
	removeSelectedBox: (box: MailBox) => void;
};

const useSelectStore = create<Store>((set) => ({
	showSelector: false,
	setShowSelector: (showSelector) => set({ showSelector }),
	selectedBoxes: [],
	addSelectedBox: (box) =>
		set((state) => ({ selectedBoxes: [...state.selectedBoxes, box] })),
	removeSelectedBox: (box) =>
		set((state) => ({
			selectedBoxes: state.selectedBoxes.filter((item) => item.id != box.id)
		}))
}));

const UnMemoizedBoxesList: FC = () => {
	const [boxes] = useLocalStorageState<{ name: string; id: string }[]>("boxes");

	const [selectedBox] = useSelectedBox();

	const showAddBox = useStore((state) => state.showAddBox);
	const setShowAddBox = useStore((state) => state.setShowAddBox);

	const setShowSelector = useSelectStore((state) => state.setShowSelector);
	const showSelector = useSelectStore((state) => state.showSelector);

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
				?.filter((box) => findBoxInPrimaryBoxesList(box.id))
				.sort((a, b) => a.id.localeCompare(b.id))
				.map((box) => {
					const found = findBoxInPrimaryBoxesList(box.id);

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					return { ...box, ...found! };
				}),
		[boxes]
	);

	// Find all of the other boxes and sort them alphabetically
	const otherBoxes: MailBox[] | undefined = useMemo(
		() =>
			boxes
				?.filter((box) => !findBoxInPrimaryBoxesList(box.id))
				.sort((a, b) => a.id.localeCompare(b.id)),
		[boxes]
	);

	return (
		<>
			{showAddBox && <AddBox />}
			<Stack
				sx={{ padding: 1 }}
				spacing={1}
				direction="row"
				alignItems="center"
				justifyContent="right"
			>
				{!showSelector && (
					<>
						<IconButton onClick={() => setShowSelector(true)}>
							<Tooltip title="Select folders">
								<CheckBoxIcon />
							</Tooltip>
						</IconButton>
						<IconButton onClick={() => setShowAddBox(true)}>
							<Tooltip title="Add new folder">
								<AddIcon />
							</Tooltip>
						</IconButton>
					</>
				)}
				{showSelector && (
					<>
						<IconButton onClick={() => setShowSelector(false)}>
							<Tooltip title="Stop selecting folders">
								<CloseIcon />
							</Tooltip>
						</IconButton>
					</>
				)}
			</Stack>
			{(primaryBoxes || otherBoxes) && <Divider />}
			{primaryBoxes && <FolderTree boxes={primaryBoxes} />}
			{primaryBoxes && <Divider />}
			{otherBoxes && <FolderTree boxes={otherBoxes} />}
		</>
	);
};

const UnMemoizedFolderTree: FC<{ boxes: MailBox[] }> = ({ boxes }) => {
	const [selectedBox] = useSelectedBox();

	return (
		<List>
			{boxes.map((box) => (
				<ListItem
					key={box.id}
					isSelectedBox={box.id == selectedBox?.id}
					box={box}
				/>
			))}
		</List>
	);
};

const FolderTree = memo(UnMemoizedFolderTree);

const UnMemoizedListItem: FC<{ box: MailBox; isSelectedBox: boolean }> = ({
	box,
	isSelectedBox
}) => {
	const [, setSelectedBox] = useSelectedBox();

	const [isOpen, setOpen] = useState(true);

	const theme = useTheme();

	const switchBox = (box: MailBox): void => {
		setSelectedBox(box);
	};

	const indent = useMemo(
		() => theme.spacing(2 + box.id.split(".").length),
		[theme.spacing, box.id]
	);

	return (
		<>
			{box.children && box.children.length != 0 && (
				<>
					<ListItemButton
						onClick={() => switchBox(box)}
						selected={isSelectedBox}
						sx={{ pl: indent }}
					>
						<SelectorCheckBox box={box} />

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
							<FolderTree boxes={box.children} />
						</List>
					</Collapse>
				</>
			)}
			{(!box.children || (box.children && box.children.length == 0)) && (
				<MUIListItem selected={isSelectedBox} disablePadding>
					<ListItemButton sx={{ pl: indent }} onClick={() => switchBox(box)}>
						<SelectorCheckBox box={box} />
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

const ListItem = memo(UnMemoizedListItem);

const SelectorCheckBox: FC<{ box: MailBox }> = ({ box }) => {
	const addSelectedBox = useSelectStore((state) => state.addSelectedBox);
	const removeSelectedBox = useSelectStore((state) => state.removeSelectedBox);
	const showSelector = useSelectStore((state) => state.showSelector);

	const [checked, setChecked] = useState(false);

	useEffect(() => {
		if (checked) addSelectedBox(box);
		else removeSelectedBox(box);
	}, [checked]);

	if (!showSelector) return <></>;

	return (
		<Checkbox checked={checked} onChange={(checked) => setChecked(!checked)} />
	);
};

const BoxesList = memo(UnMemoizedBoxesList);

export default BoxesList;

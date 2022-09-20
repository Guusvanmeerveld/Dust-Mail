import create, { StoreApi, UseBoundStore, useStore } from "zustand";

import {
	FC,
	memo,
	useMemo,
	useState,
	createContext,
	useContext,
	MouseEvent
} from "react";

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import MUIListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";

import MailBox from "@interfaces/box";

import useSelectedBox from "@utils/hooks/useSelectedBox";
import useTheme from "@utils/hooks/useTheme";

export interface CheckedBoxesStore {
	checkedBoxes: Record<string, boolean>;
	setChecked: (id: string, checked: boolean) => void;
}

export const checkedBoxesStore = create<CheckedBoxesStore>((set) => ({
	checkedBoxes: {},
	setChecked: (id, checked) =>
		set((state) => ({ checkedBoxes: { ...state.checkedBoxes, [id]: checked } }))
}));

export const CheckedBoxesContext = createContext<UseBoundStore<
	StoreApi<CheckedBoxesStore>
> | null>(null);

export interface FolderTreeProps {
	onClick?: (box: MailBox, e: MouseEvent) => void;
	showCheckBox: boolean;
}

const UnMemoizedFolderTree: FC<
	{
		boxes: MailBox[];
	} & FolderTreeProps
> = ({ boxes, ...props }) => {
	const [selectedBox] = useSelectedBox();

	return (
		<List>
			{boxes.map((box) => (
				<ListItem
					{...props}
					key={box.id}
					isSelectedBox={box.id == selectedBox?.id}
					box={box}
				/>
			))}
		</List>
	);
};

const FolderTree = memo(UnMemoizedFolderTree);

const UnMemoizedListItem: FC<
	{
		box: MailBox;
		isSelectedBox: boolean;
	} & FolderTreeProps
> = ({ box, isSelectedBox, showCheckBox, onClick }) => {
	const store = useContext(CheckedBoxesContext);

	if (!store) throw new Error("no context provided");

	const checked =
		useStore(store, (state) => state.checkedBoxes[box.id]) ?? false;
	const setChecked = useStore(store, (state) => state.setChecked);

	const [isOpen, setOpen] = useState(true);

	const theme = useTheme();

	const indent = useMemo(
		() =>
			theme.spacing(
				(showCheckBox ? 0 : 2) + box.id.split(box.delimiter ?? ".").length
			),
		[theme.spacing, box.id, showCheckBox]
	);

	const handleClick =
		onClick && !showCheckBox
			? (e: MouseEvent) => {
					onClick(box, e);
			  }
			: () => setChecked(box.id, !checked);

	return (
		<>
			{box.children && box.children.length != 0 && (
				<>
					<ListItemButton onClick={handleClick} selected={isSelectedBox}>
						<Box sx={{ mr: indent }}>
							{showCheckBox && <Checkbox checked={checked} />}
						</Box>
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
						<FolderTree
							{...{
								boxes: box.children,
								showCheckBox,
								onClick
							}}
						/>
					</Collapse>
				</>
			)}
			{(!box.children || (box.children && box.children.length == 0)) && (
				<MUIListItem selected={isSelectedBox} disablePadding>
					<ListItemButton onClick={handleClick}>
						<Box sx={{ mr: indent }}>
							{showCheckBox && <Checkbox checked={checked} />}
						</Box>
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

export default FolderTree;

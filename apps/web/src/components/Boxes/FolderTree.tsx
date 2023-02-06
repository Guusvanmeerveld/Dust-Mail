import { StoreApi, UseBoundStore, useStore } from "zustand";

import {
	FC,
	memo,
	useMemo,
	useState,
	createContext,
	useContext,
	MouseEvent
} from "react";

import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import MUIListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
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

export const CheckedBoxesContext = createContext<UseBoundStore<
	StoreApi<CheckedBoxesStore>
> | null>(null);

export interface FolderTreeProps {
	onClick?: (box: MailBox, e: MouseEvent) => void;
	onContextMenu?: (box: MailBox, e: MouseEvent<HTMLElement>) => void;
	showCheckBox: boolean;
}

const UnMemoizedFolderTree: FC<
	{
		boxes: MailBox[];
		title?: string;
	} & FolderTreeProps
> = ({ boxes, title, ...props }) => {
	const { box: selectedBox } = useSelectedBox();

	return (
		<List
			subheader={
				title ? (
					<ListSubheader
						sx={{
							backgroundImage: {
								xs: "linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15))",
								md: "none"
							}
						}}
						component="div"
						id={`subheader-${title}`}
					>
						{title}
					</ListSubheader>
				) : null
			}
		>
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
> = ({ box, isSelectedBox, showCheckBox, onClick, onContextMenu }) => {
	const store = useContext(CheckedBoxesContext);

	if (!store) throw new Error("No context provided");

	const checked =
		useStore(store, (state) => state.checkedBoxes[box.id]) ?? false;
	const setChecked = useStore(store, (state) => state.setChecked);

	const [isOpen, setOpen] = useState(true);

	const theme = useTheme();

	const indent = useMemo(
		() =>
			theme.spacing(
				(showCheckBox ? 0 : 2) + box.id.split(box.delimiter ?? "").length
			),
		[theme.spacing, box.id, showCheckBox]
	);

	const handleClick = box.selectable
		? onClick && !showCheckBox
			? (e: MouseEvent) => {
					onClick(box, e);
			  }
			: () => setChecked(box.id, !checked)
		: undefined;

	const handleContextMenu = (e: MouseEvent<HTMLElement>): void => {
		if (onContextMenu && !showCheckBox) onContextMenu(box, e);
	};

	const badge =
		box.counts && box.counts.unseen != 0 ? box.counts.unseen : undefined;

	return (
		<>
			{box.children && box.children.length != 0 && (
				<>
					<ListItemButton
						disabled={handleClick == undefined}
						onClick={handleClick}
						onContextMenu={handleContextMenu}
						selected={isSelectedBox}
					>
						<Box sx={{ mr: indent }}>
							{showCheckBox && <Checkbox checked={checked} />}
						</Box>
						<ListItemIcon>
							<Icon icon={box.icon} badge={badge} />
						</ListItemIcon>
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
								onContextMenu,
								onClick
							}}
						/>
					</Collapse>
				</>
			)}
			{(!box.children || (box.children && box.children.length == 0)) && (
				<MUIListItem selected={isSelectedBox} disablePadding>
					<ListItemButton
						disabled={handleClick == undefined}
						onClick={handleClick}
						onContextMenu={handleContextMenu}
					>
						<Box sx={{ mr: indent }}>
							{showCheckBox && <Checkbox checked={checked} />}
						</Box>
						<ListItemIcon>
							<Icon icon={box.icon} badge={badge} />
						</ListItemIcon>
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

const Icon: FC<{
	icon?: JSX.Element;
	badge?: number;
}> = ({ icon, badge }) => {
	if (badge && badge != 0)
		return (
			<Badge max={999} badgeContent={badge} color="primary">
				{icon ?? <FolderIcon />}
			</Badge>
		);

	return icon ?? <FolderIcon />;
};

const ListItem = memo(UnMemoizedListItem);

export default FolderTree;

import useLocalStorageState from "use-local-storage-state";

import { FC, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Modal from "@mui/material/Modal";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import SelectAllIcon from "@mui/icons-material/CheckBox";
import DeselectAllIcon from "@mui/icons-material/CheckBoxOutlineBlank";

import MailBox from "@interfaces/box";

import modalStyles from "@styles/modal";
import scrollbarStyles from "@styles/scrollbar";

import flattenBoxesArray from "@utils/flattenBoxesArray";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

import FolderTree, {
	checkedBoxesStore,
	CheckedBoxesContext
} from "@components/Boxes/FolderTree";

type FolderType = "unified" | "normal" | "none";

const AddBox: FC = () => {
	const theme = useTheme();

	const [boxes, setBoxes] = useLocalStorageState<MailBox[]>("boxes");

	const setShowAddBox = useStore((state) => state.setShowAddBox);
	const showAddBox = useStore((state) => state.showAddBox);

	const unifiedBoxes = checkedBoxesStore((state) => state.checkedBoxes);
	const addUnifiedBox = checkedBoxesStore((state) => state.setChecked);

	const checkedBoxes = useMemo(
		() => Object.entries(unifiedBoxes).filter(([, checked]) => checked),
		[unifiedBoxes]
	);

	const [folderType, setFolderType] = useState<FolderType>("none");

	const [parentFolder, setParentFolder] = useState<string>("none");

	const [folderName, setFolderName] = useState<string>("");

	const handleClose = (): void => setShowAddBox(false);

	const boxIDs = useMemo(() => {
		if (boxes) return flattenBoxesArray(boxes);
		else return [];
	}, boxes);

	const [modalSx, scrollbarSx] = useMemo(
		() => [modalStyles(theme), scrollbarStyles(theme)],
		[theme]
	);

	const checkAllBoxes = (checked: boolean): void => {
		const ids = boxIDs.map((box) => box.id);

		ids.forEach((id) => addUnifiedBox(id, checked));
	};

	const createBox = (box: MailBox): void => {
		if (boxes) setBoxes([...boxes, box]);
	};

	return (
		<Modal open={showAddBox} onClose={handleClose}>
			<Stack
				spacing={2}
				direction="column"
				sx={{
					...modalSx,
					...scrollbarSx,
					maxHeight: "90%",
					overflowY: "scroll"
				}}
			>
				<Typography gutterBottom variant="h3">
					Create a new folder
				</Typography>

				<FormControl fullWidth>
					<InputLabel id="folder-type-label">Folder type</InputLabel>
					<Select
						labelId="folder-type-label"
						id="folder-type"
						value={folderType}
						label="Folder type"
						onChange={(e) => setFolderType(e.target.value as FolderType)}
					>
						<MenuItem value="none">None</MenuItem>
						<MenuItem value="unified">
							Unified
							<Typography
								sx={{
									ml: 2,
									display: "inline",
									color: theme.palette.text.secondary
								}}
							>
								Create a (local) inbox that unifies together multiple inboxes
							</Typography>
						</MenuItem>
						<MenuItem value="normal">
							Normal
							<Typography
								sx={{
									ml: 2,
									display: "inline",
									color: theme.palette.text.secondary
								}}
							>
								Create a new inbox on the server
							</Typography>
						</MenuItem>
					</Select>
				</FormControl>

				{folderType != "none" && (
					<TextField
						fullWidth
						value={folderName}
						onChange={(e) => setFolderName(e.target.value)}
						label="Folder name"
					/>
				)}

				{folderType != "none" && (
					<FormControl fullWidth>
						<InputLabel id="parent-folder-label">Parent folder</InputLabel>
						<Select
							labelId="parent-folder-label"
							id="parent-folder"
							value={parentFolder}
							label="Parent folder"
							onChange={(e) => setParentFolder(e.target.value)}
							MenuProps={{
								sx: {
									maxHeight: 300
								}
							}}
						>
							<MenuItem value="none">None</MenuItem>
							{boxIDs.map((box, i) => (
								<MenuItem key={box.id + i} value={box.id}>
									{box.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				)}

				{folderType == "unified" && boxes && (
					<>
						<Stack direction="column" justifyContent="left" spacing={2}>
							<Typography variant="h5">
								Select the folders you want to be unified
							</Typography>

							<Stack direction="row" alignItems="center" spacing={2}>
								<Button
									onClick={() => checkAllBoxes(true)}
									variant="outlined"
									startIcon={<SelectAllIcon />}
								>
									Select all folders
								</Button>

								<Button
									onClick={() => checkAllBoxes(false)}
									variant="outlined"
									startIcon={<DeselectAllIcon />}
								>
									Deselect all folders
								</Button>
							</Stack>
						</Stack>
						<Box
							sx={{
								...scrollbarSx,
								maxHeight: "15rem",
								overflowY: "scroll"
							}}
						>
							<CheckedBoxesContext.Provider value={checkedBoxesStore}>
								<FolderTree showCheckBox boxes={boxes} />
							</CheckedBoxesContext.Provider>
						</Box>
					</>
				)}

				<Button
					disabled={
						folderType == "none" ||
						folderName == "" ||
						parentFolder == "none" ||
						(folderType == "unified" && checkedBoxes.length == 0)
					}
					onClick={() =>
						createBox({
							name: folderName,
							id: folderName,
							unifies:
								folderType == "unified"
									? boxIDs.length == checkedBoxes.length
										? "all"
										: checkedBoxes.map((box) => box[0])
									: undefined
						})
					}
					variant="contained"
				>
					Create
				</Button>
			</Stack>
		</Modal>
	);
};

export default AddBox;

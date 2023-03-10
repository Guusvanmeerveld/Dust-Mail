import create from "zustand";

import { FC, memo, useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
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

import useBoxes from "@utils/hooks/useBoxes";
import useSnackbar from "@utils/hooks/useSnackbar";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";
import useUser from "@utils/hooks/useUser";

import FolderTree, {
	CheckedBoxesContext,
	CheckedBoxesStore
} from "@components/Boxes/FolderTree";

export const checkedBoxesStore = create<CheckedBoxesStore>((set) => ({
	checkedBoxes: {},
	setChecked: (id, checked) =>
		set((state) => ({ checkedBoxes: { ...state.checkedBoxes, [id]: checked } }))
}));

export type FolderType = "unified" | "normal" | "none";

interface AddBoxStore {
	folderType: FolderType;
	setFolderType: (folderType: FolderType) => void;
	parentFolder: MailBox | undefined;
	setParentFolder: (parentFolder: MailBox | undefined) => void;
	folderName: string;
	setFolderName: (folderName: string) => void;
}

export const addBoxStore = create<AddBoxStore>((set) => ({
	folderType: "none",
	setFolderType: (folderType) => set(() => ({ folderType })),
	parentFolder: undefined,
	setParentFolder: (parentFolder) => set(() => ({ parentFolder })),
	folderName: "",
	setFolderName: (folderName) => set(() => ({ folderName }))
}));

const UnMemoizedAddBox: FC = () => {
	const theme = useTheme();

	const user = useUser();
	// const addBox = useAddBox();

	const showSnackbar = useSnackbar();

	const setShowAddBox = useStore((state) => state.setShowAddBox);
	const showAddBox = useStore((state) => state.showAddBox);

	const setFetching = useStore((state) => state.setFetching);

	const unifiedBoxes = checkedBoxesStore((state) => state.checkedBoxes);

	const { boxes, error: boxesError, findBox } = useBoxes();

	const [error, setError] = useState<string>();

	const checkedBoxes = useMemo(
		() =>
			Object.entries(unifiedBoxes)
				.filter(([, checked]) => checked)
				.map(([id]) => id),
		[unifiedBoxes]
	);

	const folderType = addBoxStore((state) => state.folderType);
	const setFolderType = addBoxStore((state) => state.setFolderType);

	const parentFolder = addBoxStore((state) => state.parentFolder);
	const setParentFolder = addBoxStore((state) => state.setParentFolder);

	const folderName = addBoxStore((state) => state.folderName);
	const setFolderName = addBoxStore((state) => state.setFolderName);

	const handleClose = (): void => setShowAddBox(false);

	useEffect(
		() => setError(undefined),
		[folderType, parentFolder, folderName, showAddBox]
	);

	useEffect(() => {
		if (boxesError) setError(boxesError);
	}, [boxesError]);

	useEffect(() => {
		if (!showAddBox) {
			setFolderType("none");
			setParentFolder(undefined);
			setFolderName("");
		}
	}, [showAddBox]);

	const [modalSx, scrollbarSx] = useMemo(
		() => [modalStyles(theme), scrollbarStyles(theme)],
		[theme]
	);

	const checkAllBoxes = (checked: boolean): void => {
		if (!user) return;
	};

	const createBox = async (box: MailBox): Promise<void> => {
		// addBox(box);

		// if (!box.unifies) {
		setFetching(true);

		// await fetcher
		// 	.createBox(box.id)
		// 	.then(() => {
		// 		showSnackbar(`Folder '${box.name}' created`);
		// 		setShowAddBox(false);
		// 	})
		// 	.catch((error: AxiosError<{ message: string }>) => {
		// 		const message = error.response?.data.message;

		// 		if (message) setError(message);
		// 	});

		setFetching(false);
		// }
	};

	return (
		<>
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
					<>
						<Typography gutterBottom variant="h4">
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
										Create a (local) folder that unifies multiple folders
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
										Create a new folder on the server
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
									value={parentFolder?.id ?? "none"}
									label="Parent folder"
									onChange={(e) => {
										const parentFolder = findBox(e.target.value);

										setParentFolder(parentFolder ?? undefined);
									}}
									MenuProps={{
										sx: {
											maxHeight: 300
										}
									}}
								>
									<MenuItem value="none">None</MenuItem>
									<MenuItem value="root">Top level</MenuItem>
									{/* TODO: Fix this */}
									{/* {user?.boxes.flattened.map((box, i) => (
									<MenuItem key={box.id + i} value={box.id}>
										{box.id.split(box.delimiter).join(" / ")}
									</MenuItem>
								))} */}
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
								(folderType == "unified" && checkedBoxes.length == 0)
							}
							onClick={() =>
								createBox({
									name: folderName,
									id:
										(parentFolder
											? parentFolder.id + parentFolder.delimiter
											: "") + folderName,
									delimiter: parentFolder?.delimiter ?? ".",
									children: [],
									counts: null,
									selectable: true
									// TODO: Look at unified mailboxes
									// unifies:
									// 	folderType == "unified"
									// 		? checkedBoxes.map((box) => box[0])
									// 		: undefined
								})
							}
							variant="contained"
						>
							Create
						</Button>

						{error && <Alert severity="error">{error}</Alert>}
					</>
				</Stack>
			</Modal>
		</>
	);
};

const AddBox = memo(UnMemoizedAddBox);

export default AddBox;

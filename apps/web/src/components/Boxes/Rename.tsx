import useLocalStorageState from "use-local-storage-state";
import create from "zustand";

import { FC, memo, useState } from "react";

import { AxiosError } from "axios";

import { ErrorResponse } from "@dust-mail/typings";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import Box from "@interfaces/box";

import useBoxes from "@utils/hooks/useBoxes";
import useHttpClient from "@utils/hooks/useFetch";
import useSnackbar from "@utils/hooks/useSnackbar";
import useStore from "@utils/hooks/useStore";
import nestBoxes from "@utils/nestBoxes";

interface RenameBoxStore {
	boxToRename: Box | undefined;
	setBoxToRename: (boxToRename: Box) => void;
}

export const renameBoxStore = create<RenameBoxStore>((set) => ({
	boxToRename: undefined,
	setBoxToRename: (boxToRename: Box) => set({ boxToRename })
}));

const UnMemoizedRenameBox: FC = () => {
	const showRenameBoxDialog = useStore((state) => state.showRenameBoxDialog);
	const setShowRenameBoxDialog = useStore(
		(state) => state.setShowRenameBoxDialog
	);

	const boxToRename = renameBoxStore((state) => state.boxToRename);

	const fetcher = useHttpClient();

	const openSnackbar = useSnackbar();

	let [flattenedBoxes] = useBoxes();

	const [, setBoxes] = useLocalStorageState<Box[]>("boxes");

	const [newName, setNewName] = useState("");

	const [error, setError] = useState<string>();

	const handleClose = (): void => {
		setShowRenameBoxDialog(false);
		setNewName("");
		setError(undefined);
	};

	const renameBox = async (): Promise<void> => {
		if (!boxToRename) return;

		const prefix = boxToRename.id.split(boxToRename.delimiter);

		prefix.pop();

		prefix.push(newName);

		const newBoxID = prefix.join(boxToRename.delimiter);

		await fetcher
			.renameBox(boxToRename.id, newBoxID)
			.then(() => {
				openSnackbar(`Folder '${boxToRename.name}' renamed to '${newName}'`);

				if (flattenedBoxes) {
					flattenedBoxes = flattenedBoxes.filter(
						(box) => box.id != boxToRename.id
					);

					const newBox: Box = { ...boxToRename, id: newBoxID, name: newName };

					flattenedBoxes.push(newBox);

					setBoxes(nestBoxes(flattenedBoxes));
				}

				handleClose();
			})
			.catch((e: AxiosError<ErrorResponse>) => {
				const errorMessage = e.response?.data.message;

				if (errorMessage) setError(errorMessage);
			});
	};

	return (
		<Dialog open={showRenameBoxDialog} onClose={handleClose}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					renameBox();
				}}
			>
				<DialogTitle>Rename folder &apos;{boxToRename?.name}&apos;</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						id="newFolderName"
						label="New folder name"
						type="text"
						fullWidth
						variant="standard"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						sx={{ mb: 2 }}
					/>
					{error && <Alert severity="error">Error: {error}</Alert>}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button type="submit">Rename</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
};

const RenameBox = memo(UnMemoizedRenameBox);

export default RenameBox;

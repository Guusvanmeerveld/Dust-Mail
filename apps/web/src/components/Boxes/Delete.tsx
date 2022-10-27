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
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import Box from "@interfaces/box";

import useBoxes from "@utils/hooks/useBoxes";
import useHttpClient from "@utils/hooks/useFetch";
import useSnackbar from "@utils/hooks/useSnackbar";
import useStore from "@utils/hooks/useStore";
import nestBoxes from "@utils/nestBoxes";

interface DeleteBoxStore {
	boxesToDelete: string[];
	setBoxesToDelete: (boxesToDelete: string[]) => void;
}

export const deleteBoxStore = create<DeleteBoxStore>((set) => ({
	boxesToDelete: [],
	setBoxesToDelete: (boxesToDelete) => set({ boxesToDelete })
}));

const UnMemoizedDeleteBox: FC = () => {
	let [flattenedBoxes] = useBoxes();
	const [, setBoxes] = useLocalStorageState<Box[]>("boxes");

	const fetcher = useHttpClient();

	const openSnackbar = useSnackbar();

	const showDeleteItemsDialog = useStore(
		(state) => state.showDeleteItemsDialog
	);
	const setShowDeleteItemsDialog = useStore(
		(state) => state.setShowDeleteItemsDialog
	);

	const boxesToDelete = deleteBoxStore((state) => state.boxesToDelete);
	const setBoxesToDelete = deleteBoxStore((state) => state.setBoxesToDelete);

	const [error, setError] = useState<string>();

	const deleteItemsDialogOnClose = (): void => {
		setShowDeleteItemsDialog(false);
		setError(undefined);
		setBoxesToDelete([]);
	};

	const deleteSelectedItems = async (): Promise<void> => {
		await fetcher
			.deleteBox(boxesToDelete)
			.then(() => {
				openSnackbar(`Folder(s) '${boxesToDelete.join("', '")}' deleted`);

				if (flattenedBoxes) {
					flattenedBoxes = flattenedBoxes.filter(
						(box) => !boxesToDelete.includes(box.id)
					);

					setBoxes(nestBoxes(flattenedBoxes));
				}

				deleteItemsDialogOnClose();
				setBoxesToDelete([]);
			})
			.catch((error: AxiosError<ErrorResponse>) => {
				const errorMessage = error.response?.data.message;

				if (errorMessage) setError(errorMessage);
			});
	};

	return (
		<Dialog
			open={showDeleteItemsDialog}
			onClose={deleteItemsDialogOnClose}
			aria-labelledby="delete-items-dialog"
			aria-describedby="Are you sure you wish to delete these items?"
		>
			<DialogTitle id="delete-items-dialog-title">
				Are you sure you wish to delete &apos;{boxesToDelete.join("', '")}
				&apos;?
			</DialogTitle>
			<DialogContent>
				<DialogContentText sx={{ mb: 2 }} id="alert-dialog-description">
					Every email in the selected folders will be deleted!
				</DialogContentText>
				{error && <Alert severity="error">Error: {error}</Alert>}
			</DialogContent>
			<DialogActions>
				<Button onClick={deleteItemsDialogOnClose}>Cancel</Button>
				<Button onClick={() => deleteSelectedItems()} autoFocus>
					Delete
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const DeleteBox = memo(UnMemoizedDeleteBox);

export default DeleteBox;

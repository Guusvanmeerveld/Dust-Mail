import create from "zustand";

import { FC, memo, useState } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import useSnackbar from "@utils/hooks/useSnackbar";
import useStore from "@utils/hooks/useStore";

interface DeleteBoxStore {
	boxesToDelete: string[];
	setBoxesToDelete: (boxesToDelete: string[]) => void;
}

export const deleteBoxStore = create<DeleteBoxStore>((set) => ({
	boxesToDelete: [],
	setBoxesToDelete: (boxesToDelete) => set({ boxesToDelete })
}));

const UnMemoizedDeleteBox: FC = () => {
	const openSnackbar = useSnackbar();

	const showDeleteItemsDialog = useStore(
		(state) => state.showDeleteItemsDialog
	);
	const setShowDeleteItemsDialog = useStore(
		(state) => state.setShowDeleteItemsDialog
	);

	const setFetching = useStore((state) => state.setFetching);

	const boxesToDelete = deleteBoxStore((state) => state.boxesToDelete);
	const setBoxesToDelete = deleteBoxStore((state) => state.setBoxesToDelete);

	const [error, setError] = useState<string>();

	const deleteItemsDialogOnClose = (): void => {
		setShowDeleteItemsDialog(false);
		setError(undefined);
		setBoxesToDelete([]);
	};

	const deleteSelectedItems = async (): Promise<void> => {
		setFetching(true);

		// await fetcher
		// 	.deleteBox(boxesToDelete)
		// 	.then(() => {
		// 		openSnackbar(`Folder(s) '${boxesToDelete.join("', '")}' deleted`);

		// 		deleteItemsDialogOnClose();
		// 		setBoxesToDelete([]);
		// 	})
		// 	.catch((error: AxiosError<ErrorResponse>) => {
		// 		const errorMessage = error.response?.data.message;

		// 		if (errorMessage) setError(errorMessage);
		// 	});

		setFetching(false);
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

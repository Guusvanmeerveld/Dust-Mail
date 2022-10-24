import useLocalStorageState from "use-local-storage-state";

import { checkedBoxesStore } from "./List";

import { FC, memo, useMemo, useState } from "react";

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

	const checkedBoxes = checkedBoxesStore((state) => state.checkedBoxes);
	const setChecked = checkedBoxesStore((state) => state.setChecked);

	const [deleteItemsError, setDeleteItemsError] = useState<string>();

	const selectedBoxesArray = useMemo(
		() =>
			Object.entries(checkedBoxes)
				.filter(([, checked]) => checked)
				.map(([id]) => id),
		[checkedBoxes]
	);

	const deleteItemsDialogOnClose = (): void => {
		setShowDeleteItemsDialog(false);
		setDeleteItemsError(undefined);
	};

	const deleteSelectedItems = async (): Promise<void> => {
		await fetcher
			.deleteBox(selectedBoxesArray)
			.then(() => {
				openSnackbar(`Folder(s) '${selectedBoxesArray.join(", ")}' deleted`);

				if (flattenedBoxes) {
					flattenedBoxes = flattenedBoxes.filter(
						(box) => !selectedBoxesArray.includes(box.id)
					);

					setBoxes(nestBoxes(flattenedBoxes));
				}

				deleteItemsDialogOnClose();
				selectedBoxesArray.forEach((deleted) => setChecked(deleted, false));
			})
			.catch((error: AxiosError<ErrorResponse>) => {
				const errorMessage = error.response?.data.message;

				if (errorMessage) setDeleteItemsError(errorMessage);
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
				Are you sure you wish to delete &apos;{selectedBoxesArray.join(", ")}
				&apos;?
			</DialogTitle>
			<DialogContent>
				<DialogContentText sx={{ mb: 2 }} id="alert-dialog-description">
					Every email in the selected folders will be deleted!
				</DialogContentText>
				{deleteItemsError && (
					<Alert severity="error">Error: {deleteItemsError}</Alert>
				)}
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

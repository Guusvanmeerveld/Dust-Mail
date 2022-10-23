import create from "zustand";

import { FC } from "react";

import Alert from "@mui/material/Alert";
// import IconButton from "@mui/material/IconButton";
import MaterialSnackbar from "@mui/material/Snackbar";

// import CloseIcon from "@mui/icons-material/Close";

interface SnackbarStore {
	message: string;
	setMessage: (message: string) => void;
	open: boolean;
	setOpen: (open: boolean) => void;
}

export const useSnackbarStore = create<SnackbarStore>((set) => ({
	message: "",
	setMessage: (message) => set({ message }),
	open: false,
	setOpen: (open) => set({ open })
}));

const Snackbar: FC = () => {
	const open = useSnackbarStore((state) => state.open);
	const message = useSnackbarStore((state) => state.message);

	const setOpen = useSnackbarStore((state) => state.setOpen);

	const handleClose = (
		event: React.SyntheticEvent | Event,
		reason?: string
	): void => {
		if (reason === "clickaway") {
			return;
		}

		setOpen(false);
	};

	// const SnackBarActions = (
	// 	<>
	// 		<IconButton
	// 			size="small"
	// 			aria-label="close"
	// 			color="inherit"
	// 			onClick={handleClose}
	// 		>
	// 			<CloseIcon fontSize="small" />
	// 		</IconButton>
	// 	</>
	// );

	return (
		<MaterialSnackbar open={open} autoHideDuration={5000} onClose={handleClose}>
			<Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
				{message}
			</Alert>
		</MaterialSnackbar>
	);
};

export default Snackbar;

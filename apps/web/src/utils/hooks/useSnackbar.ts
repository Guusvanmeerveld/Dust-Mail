import { useSnackbarStore } from "@components/Snackbar";

const useSnackbar = (): ((message: string) => void) => {
	const setMessage = useSnackbarStore((state) => state.setMessage);
	const setOpen = useSnackbarStore((state) => state.setOpen);

	return (message) => {
		setMessage(message);
		setOpen(true);
	};
};

export default useSnackbar;

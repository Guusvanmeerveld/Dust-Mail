import { useSnackbarStore } from "@components/Snackbar";

const useSnackbar = (): ((
	message: string,
	variant?: "error" | "success"
) => void) => {
	const setMessage = useSnackbarStore((state) => state.setMessage);
	const setVariant = useSnackbarStore((state) => state.setVariant);
	const setOpen = useSnackbarStore((state) => state.setOpen);

	return (message, variant) => {
		setMessage(message);
		setVariant(variant ?? "success");
		setOpen(true);
	};
};

export default useSnackbar;

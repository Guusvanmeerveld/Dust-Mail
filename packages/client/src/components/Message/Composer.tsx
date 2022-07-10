import modalStyles from "@styles/modal";

import { FunctionalComponent } from "preact";

import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";

import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

const MessageComposer: FunctionalComponent = () => {
	const theme = useTheme();

	const showMessageComposer = useStore((state) => state.showMessageComposer);
	const setShowMessageComposer = useStore(
		(state) => state.setShowMessageComposer
	);

	return (
		<Modal
			open={showMessageComposer}
			onClose={() => setShowMessageComposer(false)}
		>
			<Box sx={modalStyles(theme)}>Yeet</Box>
		</Modal>
	);
};

export default MessageComposer;

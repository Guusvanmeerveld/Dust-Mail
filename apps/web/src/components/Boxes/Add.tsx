import { FC } from "react";

import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";

import modalStyles from "@styles/modal";

import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

const AddBox: FC = () => {
	const theme = useTheme();

	const setShowAddBox = useStore((state) => state.setShowAddBox);
	const showAddBox = useStore((state) => state.showAddBox);

	const handleClose = (): void => setShowAddBox(false);

	return (
		<Modal open={showAddBox} onClose={handleClose}>
			<Box sx={modalStyles(theme)}>
				<Typography gutterBottom variant="h3">
					Add new folder
				</Typography>
			</Box>
		</Modal>
	);
};

export default AddBox;

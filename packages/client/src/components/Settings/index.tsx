import { FunctionalComponent } from "preact";

import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";

import useStore from "@utils/createStore";
import useTheme from "@utils/hooks/useTheme";

const Settings: FunctionalComponent = () => {
	const theme = useTheme();

	const setShowSettings = useStore((state) => state.setShowSettings);
	const showSettings = useStore((state) => state.showSettings);

	const handleClose = () => setShowSettings(false);

	return (
		<Modal open={showSettings} onClose={handleClose}>
			<Box
				sx={{
					position: "absolute" as "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					bgcolor: theme.palette.background.paper,
					border: "2px solid #000",
					boxShadow: 24,
					p: 4
				}}
			>
				<Typography variant="h3">Settings</Typography>
				<Typography sx={{ mt: 2 }}>
					Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
				</Typography>
			</Box>
		</Modal>
	);
};

export default Settings;

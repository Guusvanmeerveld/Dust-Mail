// import useLocalStorageState from "use-local-storage-state";
import { FC, memo, ReactNode } from "react";

// import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
// import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import modalStyles from "@styles/modal";

import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

const Setting: FC<{
	title: string;
	children?: ReactNode;
	subtitle?: string;
}> = ({ title, children, subtitle }) => {
	const theme = useTheme();

	return (
		<Stack direction="row" alignItems="center">
			<Box sx={{ flex: 1, mr: 2 }}>
				<Typography variant="h5">{title}</Typography>
				<Typography color={theme.palette.text.secondary} variant="subtitle1">
					{subtitle}
				</Typography>
			</Box>
			{children}
		</Stack>
	);
};

const UnMemoizedSettings: FC = () => {
	const theme = useTheme();

	const setShowSettings = useStore((state) => state.setShowSettings);
	const showSettings = useStore((state) => state.showSettings);

	// const [boxes] = useLocalStorageState<string[]>("boxes");

	// const [defaultBox, setDefaultBox] =
	// 	useLocalStorageState<string>("defaultBox");

	const handleClose = (): void => setShowSettings(false);

	if (showSettings)
		return (
			<Modal open={showSettings} onClose={handleClose}>
				<Box sx={modalStyles(theme)}>
					<Typography gutterBottom variant="h3">
						Settings
					</Typography>
					<Stack direction="column" spacing={2}>
						<Setting
							title="Message box selected by default"
							subtitle="The message box that should show when the application loads"
						>
							{/* {boxes && (
							<Autocomplete
								disablePortal
								id="default-message-box"
								options={boxes}
								defaultValue={defaultBox}
								onChange={(_, newValue) => setDefaultBox(newValue)}
								sx={{ width: 200 }}
								renderInput={(params) => (
									<TextField
										{...params}
										inputProps={{
											...params.inputProps,
											autoComplete: "new-password" // disable autocomplete and autofill
										}}
										variant="outlined"
										label="Message box"
									/>
								)}
							/>
						)} */}
						</Setting>
					</Stack>
				</Box>
			</Modal>
		);
	else return <></>;
};

const Settings = memo(UnMemoizedSettings);

export default Settings;

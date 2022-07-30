import useLocalStorageState from "use-local-storage-state";

import { repository } from "../../../package.json";

import { FC } from "react";
import { useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import SettingsIcon from "@mui/icons-material/Settings";

import modalStyles from "@styles/modal";

import useTheme from "@utils/hooks/useTheme";

const LoginSettingsMenu: FC = () => {
	const theme = useTheme();

	const [isOpen, setOpen] = useState(false);

	const [customServerUrl, setCustomServerUrl] = useLocalStorageState(
		"customServerUrl",
		{ defaultValue: import.meta.env.VITE_DEFAULT_SERVER }
	);

	return (
		<>
			<Box
				sx={{
					position: "absolute",
					right: theme.spacing(2),
					top: theme.spacing(2)
				}}
			>
				<IconButton
					onClick={() => setOpen(true)}
					aria-label="Open custom server settings"
				>
					<SettingsIcon />
				</IconButton>
			</Box>
			{isOpen && (
				<Modal onClose={() => setOpen(false)} open={isOpen}>
					<Box sx={modalStyles(theme)}>
						<Stack direction="column" spacing={2}>
							<Typography variant="h5">
								Set custom {import.meta.env.VITE_APP_NAME} backend server
							</Typography>

							<Box>
								<Typography
									color={theme.palette.text.secondary}
									variant="subtitle1"
								>
									Only update this value if you know what you are doing!
								</Typography>

								<Typography
									color={theme.palette.text.secondary}
									variant="subtitle1"
								>
									For more information visit{" "}
									<Link href={repository.url} target="_blank" rel="noreferrer">
										the Github repo
									</Link>
									.
								</Typography>
							</Box>

							<TextField
								fullWidth
								onChange={(e) => setCustomServerUrl(e.currentTarget.value)}
								value={customServerUrl}
								id="custom-server"
								label="Custom server url/path"
								variant="outlined"
								type="text"
							/>

							<Button
								onClick={() => setOpen(false)}
								fullWidth
								variant="contained"
							>
								Save and exit
							</Button>

							<Button
								onClick={() =>
									setCustomServerUrl(import.meta.env.VITE_DEFAULT_SERVER)
								}
								disabled={
									customServerUrl == import.meta.env.VITE_DEFAULT_SERVER
								}
							>
								Reset to default value
							</Button>
						</Stack>
					</Box>
				</Modal>
			)}
		</>
	);
};

export default LoginSettingsMenu;

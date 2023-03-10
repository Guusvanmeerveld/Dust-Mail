import z from "zod";

import { repository } from "../../../package.json";

import { FC, useCallback, useEffect } from "react";
import { useState } from "react";

import { AppError, ApiSettings } from "@dust-mail/structures";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import Modal from "@mui/material/Modal";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import CheckIcon from "@mui/icons-material/Check";
import ErrorIcon from "@mui/icons-material/Error";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";

import { Result } from "@interfaces/result";

import modalStyles from "@styles/modal";

import useApiClient from "@utils/hooks/useApiClient";
import useSettings from "@utils/hooks/useSettings";
import useTheme from "@utils/hooks/useTheme";
import { createResultFromUnknown, errorToString } from "@utils/parseError";

const LoginSettingsMenu: FC = () => {
	const theme = useTheme();

	const [settings, setSetting] = useSettings();

	const [isOpen, setOpen] = useState(false);
	const [apiUrl, setApiUrl] = useState(settings.httpServerUrl ?? "");
	const [password, setPassword] = useState("");

	const apiClient = useApiClient();

	const [connectError, setConnectError] = useState<AppError | null>(null);
	const [serverSettings, setServerSettings] = useState<ApiSettings | null>(
		null
	);
	const [fetching, setFetching] = useState(false);

	const [loginError, setLoginError] = useState<AppError | null>(null);

	const fetchApiSettings = useCallback(
		async (baseUrl: string): Promise<void> => {
			setFetching(true);
			setConnectError(null);
			setServerSettings(null);

			const response = await apiClient
				.getSettings(baseUrl)
				.catch(createResultFromUnknown);

			setFetching(false);

			if (response.ok) {
				setServerSettings(response.data);
			} else {
				setConnectError(response.error);
			}
		},
		[]
	);

	const loginToApiServer = useCallback(
		async (
			baseUrl?: string,
			password?: string,
			username?: string
		): Promise<Result<void>> =>
			await apiClient
				.login(baseUrl, password, username)
				.catch(createResultFromUnknown),
		[]
	);

	useEffect(() => {
		if (isOpen) fetchApiSettings(apiUrl);
	}, [isOpen]);

	useEffect(() => {
		setLoginError(null);
	}, [isOpen, password, apiUrl]);

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

							<Stack direction="row" spacing={2}>
								<FormControl fullWidth variant="outlined">
									<InputLabel htmlFor="custom-server">
										Custom server url/path
									</InputLabel>
									<OutlinedInput
										onChange={(e) =>
											setApiUrl(z.string().parse(e.currentTarget.value))
										}
										value={apiUrl}
										id="custom-server"
										label="Custom server url/path"
										type="text"
										endAdornment={
											<InputAdornment position="end">
												{connectError !== null && <ErrorIcon color="error" />}
												{serverSettings !== null && (
													<CheckIcon color="success" />
												)}
												{fetching && <CircularProgress />}
											</InputAdornment>
										}
									/>
								</FormControl>
								<IconButton onClick={() => fetchApiSettings(apiUrl)}>
									<RefreshIcon />
								</IconButton>
							</Stack>
							{serverSettings?.authorization && (
								<Stack direction="column">
									<TextField
										fullWidth
										onChange={(e) =>
											setPassword(z.string().parse(e.currentTarget.value))
										}
										value={password}
										id="password"
										required
										label="Password for server"
										variant="outlined"
										type="password"
									/>
								</Stack>
							)}

							{loginError !== null && (
								<Alert severity="error">{errorToString(loginError)}</Alert>
							)}

							<Button
								onClick={async () => {
									const loginResult = await loginToApiServer(apiUrl, password);

									if (loginResult.ok) {
										setSetting("httpServerUrl", apiUrl);
										setOpen(false);
									} else {
										setLoginError(loginResult.error);
									}
								}}
								fullWidth
								variant="contained"
							>
								Save and exit
							</Button>

							<Button
								onClick={() => setApiUrl(import.meta.env.VITE_DEFAULT_SERVER)}
								disabled={apiUrl == import.meta.env.VITE_DEFAULT_SERVER}
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

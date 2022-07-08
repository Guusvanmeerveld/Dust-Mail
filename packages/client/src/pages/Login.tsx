import { description, repository } from "../../package.json";
import modalStyles from "@styles/modal";
import useLocalStorageState from "use-local-storage-state";

import { FunctionalComponent } from "preact";

import { TargetedEvent } from "preact/compat";
import { useEffect, useState } from "preact/hooks";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Modal from "@mui/material/Modal";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import Settings from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import Error from "@interfaces/error";
import { SecurityType, ServerType } from "@interfaces/login";

import createGravatarUrl from "@utils/createGravatarUrl";
import useFetch from "@utils/hooks/useFetch";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

import DarkModeSwitch from "@components/DarkModeSwitch";
import Loading from "@components/Loading";

const LoginSettingsMenu: FunctionalComponent = () => {
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
					<Settings />
				</IconButton>
			</Box>
			<Modal onClose={() => setOpen(false)} open={isOpen}>
				<Box sx={modalStyles(theme)}>
					<Typography gutterBottom variant="h5">
						Set custom {import.meta.env.VITE_APP_NAME} backend server
					</Typography>
					<Typography color={theme.palette.text.secondary} variant="subtitle1">
						Only update this value if you know what you are doing!
					</Typography>

					<Typography color={theme.palette.text.secondary} variant="subtitle1">
						For more information visit{" "}
						<Link href={repository.url} target="_blank" rel="noreferrer">
							the Github repo
						</Link>
						.
					</Typography>
					<br />
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
						sx={{ mt: 1 }}
						onClick={() =>
							setCustomServerUrl(import.meta.env.VITE_DEFAULT_SERVER)
						}
						disabled={customServerUrl == import.meta.env.VITE_DEFAULT_SERVER}
					>
						Reset to default value
					</Button>
				</Box>
			</Modal>
		</>
	);
};

const ServerPropertiesColumn: FunctionalComponent<{ type: ServerType }> = ({
	type
}) => {
	const setSettings = useStore((state) => state.setAdvancedLoginSettings);

	const security = useStore(
		(state) => state.advancedLoginSettings[type].security
	);

	const server = useStore((state) => state.advancedLoginSettings[type].server);

	const port = useStore((state) => state.advancedLoginSettings[type].port);

	return (
		<Grid item xs={12} md={6}>
			<Stack direction="column" spacing={2}>
				<Typography variant="h6" textAlign="center">
					{type == "incoming" ? "IMAP / POP3" : "SMTP"}
				</Typography>
				<TextField
					fullWidth
					id={`${type}-server`}
					onChange={(e) => setSettings(type, { server: e.currentTarget.value })}
					value={server}
					label="Server url/ip"
					variant="outlined"
					type="text"
				/>

				<FormControl fullWidth>
					<InputLabel id={`${type}-server-security-label`}>Security</InputLabel>
					<Select
						labelId={`${type}-server-security-label`}
						id={`${type}-server-security`}
						label="Security"
						value={security ?? "NONE"}
						onChange={(e: any) =>
							setSettings(type, { security: e.target.value as SecurityType })
						}
					>
						<MenuItem value="NONE">None (Not secure)</MenuItem>
						<MenuItem value="STARTTLS">STARTTLS (Upgrades to secure)</MenuItem>
						<MenuItem value="TLS">TLS (Secure)</MenuItem>
					</Select>
				</FormControl>

				<TextField
					fullWidth
					id={`${type}-server-port`}
					onChange={(e) =>
						setSettings(type, { port: parseInt(e.currentTarget.value) })
					}
					value={port}
					label="Port"
					helperText={`Default: ${
						type == "incoming"
							? security == "STARTTLS" || security == "TLS"
								? 993
								: 143
							: security == "STARTTLS"
							? 587
							: security == "TLS"
							? 465
							: 25
					}`}
					variant="outlined"
					min="1"
					type="number"
				/>
			</Stack>
		</Grid>
	);
};

const AdvancedLoginMenu: FunctionalComponent = () => {
	const theme = useTheme();

	const [isOpen, setOpen] = useState(false);

	return (
		<>
			<Button variant="text" onClick={() => setOpen((state) => !state)}>
				Advanced login
			</Button>
			<Modal open={isOpen} onClose={() => setOpen(false)}>
				<Box sx={modalStyles(theme)}>
					<Typography variant="h5" textAlign="center">
						Custom mail server settings
					</Typography>
					<Typography variant="subtitle1" textAlign="center">
						Customize which mail servers that you want to connect to.
					</Typography>
					<br />
					<Grid container spacing={2}>
						<ServerPropertiesColumn type="incoming" />
						<ServerPropertiesColumn type="outgoing" />
					</Grid>
				</Box>
			</Modal>
		</>
	);
};

const LoginForm: FunctionalComponent<{
	setFetching: (fetching: boolean) => void;
	fetching: boolean;
}> = ({ setFetching, fetching }) => {
	const theme = useTheme();

	useEffect(() => {
		document.title = `${import.meta.env.VITE_APP_NAME} - Login`;
	}, []);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [error, setError] = useState<
		{ message: string; type: Error } | undefined
	>();

	const [, setJwtToken] = useLocalStorageState<string>("jwtToken");

	const [, setBoxes] = useLocalStorageState<string>("boxes");

	const [, setUsername] = useLocalStorageState<string>("username");

	const [, setAvatar] = useLocalStorageState<string>("avatar");

	const [showPassword, setShowPassword] = useState(false);

	const fetcher = useFetch();

	/**
	 * Request the users inboxes and puts them in local storage
	 */
	const fetchBoxes = async (token: string): Promise<void> => {
		console.log("Fetching inboxes...");

		const boxes = await fetcher
			.get<string[]>("/mail/boxes", {
				headers: { Authorization: `Bearer ${token}` }
			})
			.then(({ data }) => data);

		setBoxes(boxes);
	};

	const missingFields = !email || !password;

	const advancedLoginSettings = useStore(
		(state) => state.advancedLoginSettings
	);

	/**
	 * Runs when the form should be submitted to the server
	 */
	const onSubmit = async (e?: TargetedEvent) => {
		if (e) e.preventDefault();

		// Reject the form if there any fields empty
		if (missingFields) {
			setError({ message: "Missing required fields", type: Error.Misc });
			return;
		}

		// Show the fetching animation
		setFetching(true);

		// Remove any old errors
		setError(undefined);

		console.log("Sending login request...");

		// Request the JWT token
		const res = await fetcher
			.post(
				"/auth/login",
				{
					username: email,
					password,
					incoming_server: advancedLoginSettings.incoming.server,
					incoming_port: advancedLoginSettings.incoming.port,
					incoming_security: advancedLoginSettings.incoming.security,
					outgoing_server: advancedLoginSettings.outgoing.server,
					outgoing_port: advancedLoginSettings.outgoing.port,
					outgoing_security: advancedLoginSettings.outgoing.security
				},
				{ validateStatus: () => true }
			)
			.catch((error) => {
				setFetching(false);

				// Handle axios errors
				if (error.code == "ERR_NETWORK") {
					setError({
						message: `Could not connect to remote ${
							import.meta.env.VITE_APP_NAME
						} server, please check your connectivity`,
						type: Error.Misc
					});
				} else {
					setError({
						message: `An unknown error occured: ${error.message}`,
						type: Error.Misc
					});
				}
			});

		if (!res) return;

		const { status, data } = res;

		// If there was anything wrong with the request, catch it
		if (status == 400) {
			// Hide the fetching animation
			setFetching(false);

			console.log("An error occured when requesting the JWT token");

			// Check the error type
			switch (data.code as Error) {
				case Error.Credentials:
					setError({
						message:
							"Failed to authorize with server, please check your credentials",
						type: Error.Credentials
					});

					break;

				case Error.Timeout:
					setError({
						message: "Server connection timed out",
						type: Error.Timeout
					});

					break;

				case Error.Network:
					setError({
						message:
							"Failed to connect to remote imap server, please check your configuration",
						type: Error.Network
					});

					break;

				default:
					setError({
						message: `Unknown error ocurred: ${data.message}`,
						type: Error.Misc
					});
					break;
			}

			return;
		}

		// Check if the request was successfull
		if (status == 201) {
			console.log("Successfully logged in, redirecting soon");

			await fetchBoxes(data);

			setUsername(email);

			console.log("Creating avatar...");

			setAvatar(createGravatarUrl(email));

			setJwtToken(data);

			return;
		}

		setFetching(false);

		setError({
			message: `Unknown error with status code ${status} occured`,
			type: Error.Misc
		});
	};

	const handleKeyDown = async (e: KeyboardEvent) => {
		if (e.key == "Enter") {
			await onSubmit();
		}
	};

	return (
		<form onSubmit={onSubmit}>
			<Stack direction="column" spacing={2}>
				<img
					style={{ width: theme.spacing(15), margin: "auto" }}
					src="/android-chrome-512x512.png"
					alt="logo"
				/>

				<Typography variant="h2">{import.meta.env.VITE_APP_NAME}</Typography>
				<Typography variant="h5">{description}</Typography>

				<TextField
					required
					onChange={(e) => setEmail(e.currentTarget.value)}
					id="username"
					error={error && error.type == Error.Credentials}
					helperText={error && error.type == Error.Credentials && error.message}
					label="Email address"
					variant="outlined"
					type="email"
				/>

				<FormControl
					error={error && error.type == Error.Credentials}
					variant="outlined"
				>
					<InputLabel htmlFor="password">Password</InputLabel>
					<OutlinedInput
						required
						onKeyDown={handleKeyDown}
						onChange={(e) => setPassword(e.currentTarget.value)}
						endAdornment={
							<InputAdornment position="end">
								<Tooltip title={`${showPassword ? "Hide" : "Show"} password`}>
									<IconButton
										aria-label="toggle password visibility"
										onClick={() => setShowPassword((state) => !state)}
										onMouseDown={() => setShowPassword((state) => !state)}
										edge="end"
									>
										{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
									</IconButton>
								</Tooltip>
							</InputAdornment>
						}
						id="password"
						label="Password"
						type={showPassword ? "text" : "password"}
					/>
				</FormControl>

				<Button
					fullWidth
					disabled={fetching || missingFields}
					onClick={onSubmit}
					variant="contained"
				>
					Login
				</Button>

				{error && (error.type == Error.Timeout || error.type == Error.Misc) && (
					<Alert sx={{ textAlign: "left" }} severity="error">
						<AlertTitle>Error</AlertTitle>
						{error.message}
					</Alert>
				)}
				<AdvancedLoginMenu />
			</Stack>
		</form>
	);
};

const Login: FunctionalComponent = () => {
	const [fetching, setFetching] = useState(false);
	const theme = useTheme();

	return (
		<>
			{fetching && <Loading />}
			<Box
				sx={{
					position: "absolute",
					left: theme.spacing(2),
					top: theme.spacing(2)
				}}
			>
				<DarkModeSwitch />
			</Box>

			<LoginSettingsMenu />
			<Box
				sx={{
					textAlign: "center",
					width: "20rem",
					height: "100vh",
					display: "flex",
					alignItems: "center",
					m: "auto"
				}}
			>
				<LoginForm setFetching={setFetching} fetching={fetching} />
			</Box>
		</>
	);
};

export default Login;

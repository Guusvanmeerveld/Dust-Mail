import { description } from "../../package.json";
import useLocalStorageState from "use-local-storage-state";

import { TargetedEvent } from "preact/compat";
import { useState } from "preact/hooks";

import axios from "axios";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import Settings from "@mui/icons-material/Settings";

import Error from "@interfaces/error";

import useFetch from "@utils/axiosClient";
import createGravatarUrl from "@utils/createGravatarUrl";
import useTheme from "@utils/hooks/useTheme";

import Loading from "@components/Loading";

const Login = () => {
	const theme = useTheme();

	const [advanced, setAdvanced] = useState(false);

	const [settingsModalState, setSettingsModalState] = useState(false);
	const [customServerUrl, setCustomServerUrl] = useLocalStorageState(
		"customServerUrl",
		{ defaultValue: import.meta.env.VITE_DEFAULT_SERVER }
	);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [server, setServer] = useState("");
	const [port, setPort] = useState<number>();

	const [fetching, setFetching] = useState(false);

	const [error, setError] = useState<
		{ message: string; type: Error } | undefined
	>();

	const [, setJwtToken] = useLocalStorageState<string>("jwtToken");

	const [, setBoxes] = useLocalStorageState<string>("boxes");

	const [, setUsername] = useLocalStorageState<string>("username");

	const [, setAvatar] = useLocalStorageState<string>("avatar");

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

	/**
	 * Runs when the form should be submitted to the server
	 */
	const onSubmit = async (e: TargetedEvent) => {
		e.preventDefault();

		// Reject the form if there any fields empty
		if (!email || !password || (advanced && (!server || !port))) {
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
					server,
					port,
					username: email,
					password
				},
				{ validateStatus: () => true }
			)
			.catch((error) => {
				setFetching(false);

				// Handle axios errors
				if (error.code == "ERR_NETWORK") {
					setError({
						message:
							"Could not connect to remote server, please check your connectivity",
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

	return (
		<>
			{fetching && <Loading />}
			<Box sx={{ position: "absolute", right: "1rem", top: "1rem" }}>
				<IconButton
					onClick={() => setSettingsModalState(true)}
					aria-label="Open custom server settings"
				>
					<Settings />
				</IconButton>
			</Box>
			<Modal
				onClose={() => setSettingsModalState(false)}
				open={settingsModalState}
			>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						border: 0,
						bgcolor: theme.palette.background.paper,
						p: 4
					}}
				>
					<Typography gutterBottom variant="h5">
						Set custom {import.meta.env.VITE_APP_NAME} backend server
					</Typography>
					<Typography color={theme.palette.text.secondary} variant="subtitle1">
						Only update this value if you know what you are doing!
					</Typography>
					<br />
					<TextField
						fullWidth
						onChange={(e) => setCustomServerUrl(e.currentTarget.value)}
						defaultValue={customServerUrl}
						id="custom-server"
						label="Custom server url/path"
						variant="outlined"
						type="text"
					/>
				</Box>
			</Modal>
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
				<form onSubmit={onSubmit}>
					<Stack direction="column" spacing={2}>
						<Typography variant="h2">
							{import.meta.env.VITE_APP_NAME}
						</Typography>
						<Typography variant="h5">{description}</Typography>
						{advanced && (
							<>
								<TextField
									required
									onChange={(e) => setServer(e.currentTarget.value)}
									error={error && error.type == Error.Network}
									helperText={
										error && error.type == Error.Network && error.message
									}
									id="server"
									label="IMAP server"
									variant="outlined"
									type="text"
								/>

								<TextField
									required
									onChange={(e) => setPort(parseInt(e.currentTarget.value))}
									error={error && error.type == Error.Network}
									id="port"
									label="Port"
									variant="outlined"
									type="number"
								/>
							</>
						)}

						<TextField
							required
							onChange={(e) => setEmail(e.currentTarget.value)}
							id="username"
							error={error && error.type == Error.Credentials}
							helperText={
								error && error.type == Error.Credentials && error.message
							}
							label="Email address"
							variant="outlined"
							type="email"
						/>

						<TextField
							required
							onChange={(e) => setPassword(e.currentTarget.value)}
							error={error && error.type == Error.Credentials}
							id="password"
							label="Password"
							variant="outlined"
							type="password"
						/>

						<Button
							fullWidth
							disabled={fetching}
							onClick={onSubmit}
							variant="contained"
						>
							Login
						</Button>
						{error &&
							(error.type == Error.Timeout || error.type == Error.Misc) && (
								<Alert sx={{ textAlign: "left" }} severity="error">
									<AlertTitle>Error</AlertTitle>
									{error.message}
								</Alert>
							)}
						<Button
							variant="text"
							onClick={() => setAdvanced((state) => !state)}
						>
							{advanced ? "Normal login" : "Advanced login"}
						</Button>
					</Stack>
				</form>
			</Box>
		</>
	);
};

export default Login;

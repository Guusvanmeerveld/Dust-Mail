import create from "zustand";

import { description } from "../../../package.json";

import { useEffect, useState, FC, memo, FormEvent, useMemo } from "react";

import { ErrorResponse, UserError } from "@dust-mail/typings";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Modal from "@mui/material/Modal";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import AdvancedLogin, { SecurityType, ServerType } from "@interfaces/login";

import modalStyles from "@styles/modal";
import scrollbarStyles from "@styles/scrollbar";

import { useMailLogin } from "@utils/hooks/useLogin";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

import OtherLogins from "@components/Login/OtherLogins";

type Store = Record<ServerType, AdvancedLogin & { error?: ErrorResponse }> & {
	setProperty: (
		type: ServerType
	) => (
		property: keyof (AdvancedLogin & { error?: ErrorResponse })
	) => (newValue?: string | number | SecurityType | ErrorResponse) => void;
};

const createLoginSettingsStore = create<Store>((set) => ({
	incoming: {},
	outgoing: {},
	setProperty: (type) => (property) => (newValue) =>
		set((state) => ({ [type]: { ...state[type], [property]: newValue } }))
}));

/**
 * Creates two input fields for the username and password
 */
const Credentials: FC<{
	error?: ErrorResponse;
	required?: boolean;
	identifier: string;
	setError: (error?: ErrorResponse) => void;
	setPassword: (password: string) => void;
	setUsername: (username: string) => void;
}> = ({ identifier, error, required, setError, setPassword, setUsername }) => {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<>
			<TextField
				required={required}
				onChange={(e) => {
					setError(undefined);
					setUsername(e.currentTarget.value);
				}}
				id={"username-" + identifier}
				error={error && error.type == UserError.Credentials}
				helperText={
					error && error.type == UserError.Credentials && error.message
				}
				label="Username"
				variant="outlined"
				type="email"
			/>

			<FormControl
				error={error && error.type == UserError.Credentials}
				required={required}
				variant="outlined"
			>
				<InputLabel htmlFor="password">Password</InputLabel>
				<OutlinedInput
					required={required}
					onChange={(e) => {
						setError(undefined);
						setPassword(e.currentTarget.value);
					}}
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
					id={"password-" + identifier}
					label="Password"
					type={showPassword ? "text" : "password"}
				/>
			</FormControl>
		</>
	);
};

const UnMemoizedServerPropertiesColumn: FC<{
	type: ServerType;
}> = ({ type }) => {
	const setSetting = createLoginSettingsStore((state) => state.setProperty);

	const security = createLoginSettingsStore((state) => state[type].security);

	const error = createLoginSettingsStore((state) => state[type].error);

	return (
		<Grid item xs={12} md={6}>
			<Stack direction="column" spacing={2}>
				<Typography variant="h6" textAlign="center">
					{type == "incoming" ? "IMAP / POP3" : "SMTP"}
				</Typography>
				<TextField
					fullWidth
					id={`${type}-server`}
					onChange={(e) => setSetting(type)("server")(e.currentTarget.value)}
					// value={server}
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
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						onChange={(e: any) => setSetting(type)("security")(e.target?.value)}
					>
						<MenuItem value="NONE">None (Not secure)</MenuItem>
						<MenuItem value="STARTTLS">STARTTLS (Upgrades to secure)</MenuItem>
						<MenuItem value="TLS">TLS (Secure)</MenuItem>
					</Select>
				</FormControl>

				<TextField
					fullWidth
					id={`${type}-server-port`}
					onChange={(e) => setSetting(type)("port")(e.currentTarget.value)}
					// value={port}
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
					type="number"
				/>

				<Credentials
					error={error}
					identifier={type}
					required={type == "incoming"}
					setError={setSetting(type)("error")}
					setPassword={setSetting(type)("password")}
					setUsername={setSetting(type)("username")}
				/>
			</Stack>
		</Grid>
	);
};

const ServerPropertiesColumn = memo(UnMemoizedServerPropertiesColumn);

const AdvancedLoginMenu: FC = () => {
	const theme = useTheme();

	const [modalSx, scrollBarSx] = useMemo(
		() => [modalStyles(theme), scrollbarStyles(theme)],
		[theme]
	);

	const [isOpen, setOpen] = useState(false);

	const login = useMailLogin();

	const setProperty = createLoginSettingsStore((state) => state.setProperty);

	const error = createLoginSettingsStore((state) => state.incoming.error);

	const incoming = createLoginSettingsStore((state) => state.incoming);
	const outgoing = createLoginSettingsStore((state) => state.outgoing);

	const missingFields = !incoming.username || !incoming.password;

	const submit = async (): Promise<void> => {
		if (missingFields) {
			setProperty("incoming")("error")({
				message: "Missing required fields",
				type: UserError.Misc
			});

			return;
		}

		await login({ incoming, outgoing }).catch((e) => {
			setProperty("incoming")("error")(e);
		});
	};

	return (
		<>
			<Button variant="text" onClick={() => setOpen((state) => !state)}>
				Advanced login
			</Button>
			<Modal open={isOpen} onClose={() => setOpen(false)}>
				<Box
					sx={{
						...modalSx,
						...scrollBarSx,
						overflowY: "scroll",
						maxHeight: "90%"
					}}
				>
					<form onSubmit={submit}>
						<Typography variant="h5" textAlign="center">
							Custom mail server settings
						</Typography>
						<Typography variant="subtitle1" textAlign="center">
							Customize which mail servers that you want to connect to.
						</Typography>
						<br />
						<Grid container spacing={2}>
							{(["incoming", "outgoing"] as ServerType[]).map((type) => (
								<ServerPropertiesColumn key={type} type={type} />
							))}
						</Grid>

						<br />

						{error &&
							(error.type == UserError.Timeout ||
								error.type == UserError.Misc ||
								error.type == UserError.Network) && (
								<>
									<Alert sx={{ textAlign: "left" }} severity="error">
										<AlertTitle>Error</AlertTitle>
										{error.message}
									</Alert>
									<br />
								</>
							)}

						<Button
							disabled={missingFields}
							type="submit"
							fullWidth
							variant="contained"
						>
							Login
						</Button>
					</form>
				</Box>
			</Modal>
		</>
	);
};

const LoginForm: FC = () => {
	const theme = useTheme();

	const fetching = useStore((state) => state.fetching);

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const [error, setError] = useState<ErrorResponse>();

	const login = useMailLogin();

	useEffect(() => {
		document.title = `${import.meta.env.VITE_APP_NAME} - Login`;
	}, []);

	const missingFields = !username || !password;

	/**
	 * Runs when the form should be submitted to the server
	 */
	const onSubmit = async (e?: FormEvent): Promise<void> => {
		if (e) e.preventDefault();

		// Reject the form if there any fields empty
		if (missingFields) {
			setError({ message: "Missing required fields", type: UserError.Misc });
			return;
		}

		// Remove any old errors
		setError(undefined);

		await login({ incoming: { username, password } }).catch((e) => setError(e));
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

				<Credentials
					error={error}
					identifier="default"
					setError={setError}
					setPassword={setPassword}
					setUsername={setUsername}
				/>

				<Button
					fullWidth
					disabled={fetching || missingFields}
					type="submit"
					variant="contained"
				>
					Login
				</Button>

				{error &&
					(error.type == UserError.Timeout ||
						error.type == UserError.Misc ||
						error.type == UserError.Network) && (
						<Alert sx={{ textAlign: "left" }} severity="error">
							<AlertTitle>Error</AlertTitle>
							{error.message}
						</Alert>
					)}

				<OtherLogins />

				<AdvancedLoginMenu />
			</Stack>
		</form>
	);
};

export default LoginForm;

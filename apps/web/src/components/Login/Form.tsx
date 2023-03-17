import React, {
	useEffect,
	useState,
	FC,
	memo,
	FormEvent,
	useMemo,
	FormEventHandler,
	useCallback
} from "react";

import {
	incomingMailServerTypeList,
	Credentials,
	outgoingMailServerTypeList,
	ServerType,
	MailServerType,
	ConnectionSecurity,
	IncomingMailServerType,
	OutgoingMailServerType
} from "@dust-mail/structures";

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
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import modalStyles from "@styles/modal";
import scrollbarStyles from "@styles/scrollbar";

import { useMailLogin } from "@utils/hooks/useLogin";
import useMailClient from "@utils/hooks/useMailClient";
import useMultiServerLoginStore, {
	defaultConfigs,
	MultiServerLoginOptions
} from "@utils/hooks/useMultiServerLoginStore";
import useOAuth2Client from "@utils/hooks/useOAuth2Client";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";
import parseEmail from "@utils/parseEmail";
import {
	createErrorFromUnknown,
	errorIsOfErrorKind,
	errorToString
} from "@utils/parseError";

const CredentialsForm: FC<{
	setError: (error?: string) => void;
	identifier: string;
	password: string;
	setPassword: (password: string) => void;
	username: string;
	setUsername: (username: string) => void;
}> = ({
	identifier,
	setError,
	setPassword,
	password,
	setUsername,
	username
}) => {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<>
			<TextField
				required
				onChange={(e) => {
					setError(undefined);
					setUsername(e.currentTarget.value);
				}}
				id={"username-" + identifier}
				value={username}
				label="Username"
				variant="outlined"
				type="email"
			/>

			<FormControl required variant="outlined">
				<InputLabel htmlFor="password">Password</InputLabel>
				<OutlinedInput
					required
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
					value={password}
					id={"password-" + identifier}
					label="Password"
					type={showPassword ? "text" : "password"}
				/>
			</FormControl>
		</>
	);
};

const UnMemoizedServerConfigColumn: FC<{
	type: ServerType;
	selectedMailServerType: MailServerType;
	security: ConnectionSecurity;
	port: number;
	server: string;
	password: string;
	username: string;
}> = ({
	type,
	selectedMailServerType,
	port,
	security,
	server,
	username,
	password
}) => {
	const setSetting = useMultiServerLoginStore(
		(state) => state.setLoginOptionsProperty
	);

	const setSelectedMailServerType = useMultiServerLoginStore(
		(state) => state.setSelectedMailServerType
	);

	const setError = useMultiServerLoginStore((state) => state.setError);

	useEffect(() => setError(undefined), [security, port, server]);

	const mailServerTypeList = useMemo(() => {
		switch (type) {
			case "incoming":
				return incomingMailServerTypeList;

			case "outgoing":
				return outgoingMailServerTypeList;
		}
	}, []);

	return (
		<Grid item xs={12} md={6}>
			<Stack direction="column" spacing={2}>
				<Tabs
					value={selectedMailServerType}
					aria-label="mail-server-type-tabs"
					onChange={(event: React.SyntheticEvent, newValue: MailServerType) => {
						setSelectedMailServerType(type, newValue);
					}}
					centered
				>
					{mailServerTypeList.map((item) => (
						<Tab id={`tab-${item}`} label={item} value={item} key={item} />
					))}
				</Tabs>
				<TextField
					fullWidth
					id={`${type}-server`}
					required
					onChange={(e) =>
						setSetting(type, selectedMailServerType)("domain")(
							e.currentTarget.value
						)
					}
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
						required
						label="Security"
						value={security}
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						onChange={(e: any) => {
							if (
								"target" in e &&
								"value" in e.target &&
								typeof e.target.value == "string"
							) {
								setSetting(type, selectedMailServerType)("security")(
									e.target.value
								);
							}
						}}
					>
						<MenuItem value="Plain">None (Not secure)</MenuItem>
						<MenuItem value="StartTls">STARTTLS (Upgrades to secure)</MenuItem>
						<MenuItem value="Tls">TLS (Secure)</MenuItem>
					</Select>
				</FormControl>

				<TextField
					fullWidth
					id={`${type}-server-port`}
					required
					onChange={(e) =>
						setSetting(type, selectedMailServerType)("port")(
							parseInt(e.currentTarget.value)
						)
					}
					value={port}
					label="Port"
					helperText={`Default: ${
						type == "incoming"
							? security == "StartTls" || security == "Tls"
								? 993
								: 143
							: security == "StartTls"
							? 587
							: security == "Tls"
							? 465
							: 25
					}`}
					variant="outlined"
					type="number"
				/>

				<CredentialsForm
					identifier={type}
					username={username}
					password={password}
					setError={setError}
					setUsername={setSetting(type, selectedMailServerType)("username")}
					setPassword={setSetting(type, selectedMailServerType)("password")}
				/>
			</Stack>
		</Grid>
	);
};

const ServerConfigColumn = memo(UnMemoizedServerConfigColumn);

const createCredentials = (
	incomingConfig: MultiServerLoginOptions,
	incomingType: IncomingMailServerType
): Credentials => {
	const {
		username: incomingUsername,
		password: incomingPassword,
		...incoming
	} = incomingConfig;

	const options: Credentials = {
		incoming: {
			...incoming,
			loginType: {
				passwordBased: {
					password: incomingPassword,
					username: incomingUsername
				}
			}
		},
		incomingType
	};

	return options;
};

const LoginOptionsMenu: FC = () => {
	const theme = useTheme();

	const [modalSx, scrollBarSx] = useMemo(
		() => [modalStyles(theme), scrollbarStyles(theme)],
		[theme]
	);

	const login = useMailLogin();

	const isOpen = useMultiServerLoginStore((state) => state.showMenu);
	const setOpen = useMultiServerLoginStore((state) => state.setShowMenu);

	const setError = useMultiServerLoginStore((state) => state.setError);
	const error = useMultiServerLoginStore((state) => state.error);

	const fetching = useStore((state) => state.fetching);

	const selectedMailServerTypes = useMultiServerLoginStore(
		(state) => state.selectedMailServerType
	);

	const provider = useMultiServerLoginStore((state) => state.provider);

	const incomingConfig = useMultiServerLoginStore(
		(state) => state.incoming[selectedMailServerTypes.incoming]
	);
	const outgoingConfig = useMultiServerLoginStore(
		(state) => state.outgoing[selectedMailServerTypes.outgoing]
	);

	const resetToDefaults = useMultiServerLoginStore(
		(state) => state.resetToDefaults
	);

	const onClose = useCallback(() => {
		resetToDefaults();
		setOpen(false);
	}, [resetToDefaults, setOpen]);

	const missingFields = useMemo(() => {
		return !incomingConfig.username || !incomingConfig.password;
	}, [incomingConfig.username, incomingConfig.password]);

	const onSubmit: FormEventHandler = async (e): Promise<void> => {
		e.preventDefault();

		if (missingFields) {
			setError("Missing required fields");

			return;
		}

		const credentials = createCredentials(
			incomingConfig,
			selectedMailServerTypes.incoming
		);

		await login(credentials)
			.then((result) => {
				if (result.ok) {
					onClose();
				} else {
					const message = errorToString(result.error);

					setError(message);
				}
			})
			.catch(createErrorFromUnknown);
	};

	return (
		<>
			<Modal open={isOpen} onClose={onClose}>
				<Box
					sx={{
						...modalSx,
						...scrollBarSx,
						overflowY: "scroll",
						maxHeight: "90%"
					}}
				>
					<form onSubmit={onSubmit}>
						<Typography variant="h5" textAlign="center">
							Login to {provider ?? "an unknown mail server"}
						</Typography>
						<Typography variant="subtitle1" textAlign="center">
							You can customize which mail servers that you want to connect to
							before actually logging in.
						</Typography>
						<Typography variant="subtitle1" textAlign="center">
							Don&apos;t know what any of this means? For most larger mail
							providers such as Google or Microsoft this will information will
							already be correct and you can just click on login.
						</Typography>
						<br />
						<Grid container spacing={2}>
							<ServerConfigColumn
								type="incoming"
								port={incomingConfig.port}
								security={incomingConfig.security}
								server={incomingConfig.domain}
								username={incomingConfig.username}
								password={incomingConfig.password}
								selectedMailServerType={selectedMailServerTypes.incoming}
							/>

							<ServerConfigColumn
								type="outgoing"
								port={outgoingConfig.port}
								security={outgoingConfig.security}
								server={outgoingConfig.domain}
								username={outgoingConfig.username}
								password={outgoingConfig.password}
								selectedMailServerType={selectedMailServerTypes.outgoing}
							/>
						</Grid>

						<br />

						{error && (
							<Alert sx={{ textAlign: "left", mb: 2 }} severity="error">
								<AlertTitle>Error</AlertTitle>
								{error}
							</Alert>
						)}

						<Button
							disabled={missingFields || fetching}
							fullWidth
							type="submit"
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

const LoginForm: FC<{
	children: React.ReactNode;
	trailing?: React.ReactNode;
}> = ({ children, trailing }) => {
	const fetching = useStore((state) => state.fetching);
	const setFetching = useStore((state) => state.setFetching);

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [displayName, setDisplayName] = useState("");

	const setLoginOptions = useMultiServerLoginStore(
		(state) => state.setLoginOptions
	);

	const setProvider = useMultiServerLoginStore((state) => state.setProvider);

	const setShowLoginOptionsMenu = useMultiServerLoginStore(
		(state) => state.setShowMenu
	);

	const setMultiServerLoginError = useMultiServerLoginStore(
		(state) => state.setError
	);

	const [error, setError] = useState<string>();

	const mailClient = useMailClient();
	const oauthClient = useOAuth2Client();

	useEffect(() => setError(undefined), [username, password]);

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
			setError("Missing required fields");
			return;
		}

		setFetching(true);

		const configResult = await mailClient
			.detectConfig(username)
			.catch((error: unknown) => setError(JSON.stringify(error)));

		setFetching(false);

		const emailAddressResult = parseEmail(username);

		if (!emailAddressResult.ok) {
			setError(errorToString(emailAddressResult.error));
			return;
		}

		const mailDomain = `mail.${emailAddressResult.data.domain}`;

		incomingMailServerTypeList.forEach((loginType) =>
			setLoginOptions("incoming", loginType, {
				...defaultConfigs["incoming"][loginType],
				domain: mailDomain,
				username,
				password
			})
		);

		outgoingMailServerTypeList.forEach((loginType) =>
			setLoginOptions("outgoing", loginType, {
				...defaultConfigs["outgoing"][loginType],
				domain: mailDomain,
				username,
				password
			})
		);

		if (!configResult) return;

		if (!configResult.ok) {
			if (errorIsOfErrorKind(configResult.error, "ConfigNotFound")) {
				setMultiServerLoginError(
					"Could not automagically detect your login servers, please fill the information in manually or try again."
				);

				setShowLoginOptionsMenu(true);
			} else {
				const message = errorToString(configResult.error);

				setError(message);
			}

			return;
		}

		const config = configResult.data;

		oauthClient.getGrant(
			config.displayName,
			config.oauth2?.oauthUrl ?? "",
			config.oauth2?.tokenUrl ?? "",
			config.oauth2?.scopes ?? []
		);

		if (
			typeof config.type != "string" &&
			config.type.multiServer?.incoming &&
			config.type.multiServer.outgoing
		) {
			const incomingConfigs: (MultiServerLoginOptions & {
				type: IncomingMailServerType;
			})[] = config.type.multiServer.incoming.map(
				({ authType, ...config }) => ({
					...config,
					loginType: authType,
					username,
					password
				})
			);

			const outgoingConfigs: (MultiServerLoginOptions & {
				type: OutgoingMailServerType;
			})[] = config.type.multiServer.outgoing.map(
				({ authType, ...config }) => ({
					...config,
					loginType: authType,
					username,
					password
				})
			);

			setProvider(config.displayName);

			incomingConfigs.forEach(({ type, ...incomingConfig }) =>
				setLoginOptions("incoming", type, incomingConfig)
			);

			outgoingConfigs.forEach(({ type, ...outgoingConfig }) =>
				setLoginOptions("outgoing", type, outgoingConfig)
			);

			setShowLoginOptionsMenu(true);
		}
	};

	return (
		<Stack direction="column" spacing={2}>
			<form onSubmit={onSubmit}>
				<Stack direction="column" spacing={2}>
					{children}

					<TextField
						onChange={(e) => {
							setError(undefined);
							setDisplayName(e.currentTarget.value);
						}}
						id="display-name"
						value={displayName}
						label="Display name"
						placeholder="The name shown when you send a message"
						variant="outlined"
						type="text"
					/>

					<CredentialsForm
						identifier="initial-login"
						password={password}
						username={username}
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
					{error && (
						<Alert sx={{ textAlign: "left" }} severity="error">
							<AlertTitle>Error</AlertTitle>
							{error}
						</Alert>
					)}
				</Stack>
			</form>
			{trailing}
			<LoginOptionsMenu />
		</Stack>
	);
};

export default LoginForm;

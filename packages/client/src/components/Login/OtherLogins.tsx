import { WebviewWindow } from "@tauri-apps/api/window";
import useLocalStorageState from "use-local-storage-state";

import { useQuery } from "react-query";

import { FunctionalComponent } from "preact";

import { useEffect, useMemo, useState } from "preact/hooks";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import modalStyles from "@styles/modal";

import useFetch from "@utils/hooks/useFetch";
import useLogin from "@utils/hooks/useLogin";
import useTheme from "@utils/hooks/useTheme";
import { LoginResponse } from "@interfaces/responses";

const oauthWindowLabel = "oauth2-login";

const useWebOAuth = (): ((oauthLink: string) => void) => {
	const [webWindow, setWebWindow] = useState<Window>();

	const [backendServer] = useLocalStorageState("customServerUrl");

	const login = useLogin();

	const onWebWindowMessage = async (e: MessageEvent<string>): Promise<void> => {
		if (e.origin != backendServer) return;

		webWindow?.close();

		setWebWindow(undefined);

		await login(JSON.parse(e.data), { redirectToDashboard: true });
	};

	useEffect(() => {
		window.addEventListener("message", onWebWindowMessage);

		return () => window.removeEventListener("message", onWebWindowMessage);
	}, [webWindow]);

	return (oauthLink) => {
		const webview = window.open(
			oauthLink,
			oauthWindowLabel,
			"height=200,width=150"
		);

		if (webview === null) return;

		setWebWindow(webview);
	};
};

const useTauriOAuth = (): ((oauthLink: string) => void) => {
	const [token, setToken] = useState<LoginResponse>();

	const login = useLogin();

	return async (url: string) => {
		const webview = new WebviewWindow(oauthWindowLabel, {
			url,
			focus: true,
			minWidth: 200,
			minHeight: 300
		});

		const unlisten = await webview.listen<LoginResponse>(
			"oauth_login_token",
			(e) => {
				setToken(e.payload);
			}
		);

		unlisten();

		// await webview.close();

		if (token) login(token);
	};
};

const OtherLogins: FunctionalComponent = () => {
	const theme = useTheme();

	const [isOpen, setOpen] = useState(false);

	const [backendServer] = useLocalStorageState("customServerUrl");

	const handleWebOAuth = useWebOAuth();
	const handleTauriOAuth = useTauriOAuth();

	const fetcher = useFetch();

	const {
		data: oauthTokens,
		isFetching,
		error
	} = useQuery<{ google?: string }>(
		["oauthTokens", backendServer],
		() => fetcher.get("/auth/oauth/tokens").then((res) => res.data),
		{ enabled: isOpen, retry: 1 }
	);

	const googleOAuthLink = useMemo(() => {
		if (!oauthTokens?.google) return;

		const params: Record<string, string> = {
			response_type: "code",
			access_type: "offline",
			approval_prompt: "force",
			scope: [
				"https://mail.google.com/",
				"https://www.googleapis.com/auth/userinfo.profile"
			].join(" "),
			client_id: oauthTokens.google,
			redirect_uri: `${backendServer}/auth/gmail`
		};

		return `https://accounts.google.com/o/oauth2/v2/auth?${Object.entries(
			params
		)
			.map(([key, value]) => `${key}=${value}`)
			.join("&")}`;
	}, [oauthTokens?.google, backendServer]);

	return (
		<>
			<Button variant="text" onClick={() => setOpen(true)}>
				Other logins
			</Button>
			{isOpen && (
				<Modal onClose={() => setOpen(false)} open={isOpen}>
					<Box sx={modalStyles(theme)}>
						<Stack direction="column" spacing={2}>
							<Typography variant="h5" textAlign="center">
								Other login methods
							</Typography>
							{isFetching && (
								<Box sx={{ display: "flex", justifyContent: "center" }}>
									<CircularProgress />
								</Box>
							)}
							{error && (
								<Typography textAlign="center">
									No other login methods supported on this{" "}
									{import.meta.env.VITE_APP_NAME} server.
								</Typography>
							)}
							<Container>
								<Stack direction="column" spacing={2}>
									{googleOAuthLink && (
										<Button
											onClick={() => {
												if ("__TAURI_METADATA__" in window)
													handleTauriOAuth(googleOAuthLink);
												else if ("open" in window)
													handleWebOAuth(googleOAuthLink);
											}}
											fullWidth
											variant="outlined"
											startIcon={
												<img
													height={30}
													src="/logo/google.png"
													alt="google-logo"
												/>
											}
										>
											Login with Google
										</Button>
									)}
								</Stack>
							</Container>
						</Stack>
					</Box>
				</Modal>
			)}
		</>
	);
};

export default OtherLogins;

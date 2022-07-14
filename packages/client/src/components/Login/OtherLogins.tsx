import useLocalStorageState from "use-local-storage-state";

import { useQuery } from "react-query";

import { FunctionalComponent } from "preact";

import { useMemo, useState } from "preact/hooks";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import modalStyles from "@styles/modal";

import useFetch from "@utils/hooks/useFetch";
import useTheme from "@utils/hooks/useTheme";

const OtherLogins: FunctionalComponent = () => {
	const theme = useTheme();

	const [backendServer] = useLocalStorageState("customServerUrl");

	const [isOpen, setOpen] = useState(false);

	const fetcher = useFetch();

	const {
		data: googleClientID,
		isFetching: fetchingGoogleClientID,
		error: googleClientIDError
	} = useQuery(
		["googleClientID", backendServer],
		() => fetcher.get("/auth/gmail/token").then((res) => res.data),
		{ enabled: isOpen, retry: 1 }
	);

	const googleOAuthLink = useMemo(() => {
		if (!googleClientID) return;

		const params: Record<string, string> = {
			response_type: "code",
			access_type: "offline",
			approval_prompt: "force",
			scope: ["https://mail.google.com/"].join(" "),
			client_id: googleClientID,
			redirect_uri: `${backendServer}/auth/gmail`
		};

		return `https://accounts.google.com/o/oauth2/v2/auth?${Object.entries(
			params
		)
			.map(([key, value]) => `${key}=${value}`)
			.join("&")}`;
	}, [googleClientID, backendServer]);

	const error = !!googleClientIDError;

	const isFetching = !!fetchingGoogleClientID;

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
							{googleOAuthLink && (
								<Button href={googleOAuthLink} fullWidth variant="contained">
									Login with Google
								</Button>
							)}
						</Stack>
					</Box>
				</Modal>
			)}
		</>
	);
};

export default OtherLogins;

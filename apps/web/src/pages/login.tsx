import { description } from "../../package.json";

import { FC } from "react";
import { Navigate } from "react-router-dom";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import DarkModeIcon from "@mui/icons-material/DarkMode";
import InfoIcon from "@mui/icons-material/Info";
import LightModeIcon from "@mui/icons-material/LightMode";
import UpdateIcon from "@mui/icons-material/Update";

import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";
import useUser from "@utils/hooks/useUser";

import DarkModeSwitch from "@components/DarkModeSwitch";
import Layout from "@components/Layout";
import LoginForm from "@components/Login/Form";
import LoginSettingsMenu from "@components/Login/Settings";

const Login: FC = () => {
	const theme = useTheme();

	const fetching = useStore((state) => state.fetching);

	const appVersion = useStore((state) => state.appVersion);
	const setShowAbout = useStore((state) => state.setShowAbout);

	const setShowChangelog = useStore((state) => state.setShowChangelog);

	const user = useUser();

	return (
		<>
			{fetching && (
				<Box sx={{ position: "fixed", width: 1, height: 2, top: 0 }}>
					<LinearProgress color="secondary" />
				</Box>
			)}
			{!!user && <Navigate to={`/dashboard`} replace={true} />}
			<Layout>
				<Box
					sx={{
						position: "fixed",
						left: theme.spacing(2),
						top: theme.spacing(2)
					}}
				>
					<Stack sx={{ alignItems: "center" }} direction="row" spacing={0.5}>
						<LightModeIcon />
						<DarkModeSwitch />
						<DarkModeIcon />
					</Stack>
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
					<LoginForm>
						<img
							style={{ width: theme.spacing(15), margin: "auto" }}
							src="/android-chrome-512x512.png"
							alt="logo"
						/>

						<Typography variant="h2">
							{import.meta.env.VITE_APP_NAME}
						</Typography>
						<Typography variant="h5">{description}</Typography>
					</LoginForm>
				</Box>
				<Box
					sx={{
						position: "fixed",
						right: theme.spacing(2),
						bottom: theme.spacing(2)
					}}
				>
					<Stack sx={{ alignItems: "center" }} direction="row" spacing={1}>
						<IconButton onClick={() => setShowChangelog(true)}>
							<UpdateIcon />
						</IconButton>
						<IconButton onClick={() => setShowAbout(true)}>
							<InfoIcon />
						</IconButton>
						<Typography>
							Version: {appVersion.title} ({appVersion.type})
						</Typography>
					</Stack>
				</Box>
			</Layout>
		</>
	);
};

export default Login;

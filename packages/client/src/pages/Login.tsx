import { FunctionalComponent } from "preact";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

import DarkModeSwitch from "@components/DarkModeSwitch";
import Layout from "@components/Layout";
import LoginForm from "@components/Login/Form";
import LoginSettingsMenu from "@components/Login/Settings";

const Login: FunctionalComponent = () => {
	const theme = useTheme();

	const appVersion = useStore((state) => state.appVersion);

	return (
		<Layout>
			<Box
				sx={{
					position: "fixed",
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
				<LoginForm />
			</Box>
			<Box
				sx={{
					position: "fixed",
					right: theme.spacing(2),
					bottom: theme.spacing(2)
				}}
			>
				<Typography>
					Version: {appVersion.title} ({appVersion.type})
				</Typography>
			</Box>
		</Layout>
	);
};

export default Login;

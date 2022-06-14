import useLocalStorageState from "use-local-storage-state";

import { FunctionComponent } from "preact";

import { useState } from "preact/hooks";

import axios from "axios";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import MenuIcon from "@mui/icons-material/Menu";

import Drawer from "@components/Navbar/Drawer";

const Navbar: FunctionComponent = () => {
	const [customServerUrl] = useLocalStorageState<string>("customServerUrl");

	const [jwtToken, setLoggedIn] = useLocalStorageState<undefined | string>(
		"jwtToken"
	);

	const [drawerState, setDrawerState] = useState(false);

	const toggleDrawer =
		(open: boolean) => (event: KeyboardEvent | MouseEvent) => {
			if (
				event.type === "keydown" &&
				((event as KeyboardEvent).key === "Tab" ||
					(event as KeyboardEvent).key === "Shift")
			) {
				return;
			}

			setDrawerState(open);
		};

	const logout = () => {
		// const data = await axios
		// 	.get(`${customServerUrl}/auth/logout`, {
		// 		headers: { Authorization: `Bearer ${jwtToken}` }
		// 	})
		// 	.then(({ data }) => data)
		// 	.catch(() => "unauthorized");

		// console.log(data);

		setLoggedIn();
	};

	return (
		<>
			<Box sx={{ flexGrow: 1 }}>
				<AppBar position="static" enableColorOnDark>
					<Toolbar>
						<IconButton
							size="large"
							edge="start"
							color="inherit"
							aria-label="menu"
							sx={{ mr: 2 }}
							onClick={toggleDrawer(true)}
						>
							<MenuIcon />
						</IconButton>
						<Typography variant="h6" sx={{ flexGrow: 1 }}>
							{import.meta.env.VITE_APP_NAME}
						</Typography>
						<Button onClick={() => logout()} color="inherit">
							Logout
						</Button>
					</Toolbar>
				</AppBar>
			</Box>
			<Drawer drawerState={drawerState} toggleDrawer={toggleDrawer} />
		</>
	);
};

export default Navbar;

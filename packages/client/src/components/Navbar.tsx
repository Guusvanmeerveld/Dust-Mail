import useLocalStorageState from "use-local-storage-state";

import { FunctionComponent } from "preact";

import { useState } from "preact/hooks";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import MenuIcon from "@mui/icons-material/Menu";

const drawerItems: { text: string; icon: JSX.Element }[] = [
	{ text: "Inbox", icon: <div></div> }
];

const Navbar: FunctionComponent = () => {
	const [drawerState, setDrawerState] = useState(false);

	const [, setLoggedIn] = useLocalStorageState<undefined>("jwtToken");

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
						<Button onClick={() => setLoggedIn()} color="inherit">
							Logout
						</Button>
					</Toolbar>
				</AppBar>
			</Box>
			<Drawer anchor="left" open={drawerState} onClose={toggleDrawer(false)}>
				{drawerItems.map((item) => (
					<ListItem key={item.text} disablePadding>
						<ListItemButton>
							<ListItemIcon>{item.icon}</ListItemIcon>
							<ListItemText primary={item.text} />
						</ListItemButton>
					</ListItem>
				))}
			</Drawer>
		</>
	);
};

export default Navbar;

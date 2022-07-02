import { FunctionalComponent } from "preact";

import { useState } from "preact/hooks";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import MenuIcon from "@mui/icons-material/Menu";
import NavigateNext from "@mui/icons-material/NavigateNext";

import useStore from "@utils/createStore";
import useTheme from "@utils/hooks/useTheme";

import Avatar from "@components/Navbar/Avatar";
import Drawer from "@components/Navbar/Drawer";

const Navbar: FunctionalComponent = () => {
	const theme = useTheme();

	const [drawerState, setDrawerState] = useState(false);

	const selectedBox = useStore((state) => state.selectedBox);

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

	const boxNameSplit = selectedBox?.name.split(".");

	const breadcrumbs = boxNameSplit?.map((crumb, i) => (
		<Typography
			key={i + 1}
			color={
				i + 1 == boxNameSplit.length
					? theme.palette.text.primary
					: theme.palette.text.secondary
			}
		>
			{crumb}
		</Typography>
	));

	return (
		<>
			<AppBar position="static">
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
						{breadcrumbs && (
							<Breadcrumbs
								separator={<NavigateNext fontSize="small" />}
								aria-label="breadcrumb"
							>
								{breadcrumbs}
							</Breadcrumbs>
						)}
					</Typography>
					<Avatar />
				</Toolbar>
			</AppBar>

			<Drawer drawerState={drawerState} toggleDrawer={toggleDrawer} />
		</>
	);
};

export default Navbar;

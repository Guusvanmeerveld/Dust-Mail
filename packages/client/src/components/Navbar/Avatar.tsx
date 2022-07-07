import useLocalStorageState from "use-local-storage-state";

import { FunctionalComponent } from "preact";

import { ChangeEvent } from "preact/compat";
import { useState } from "preact/hooks";

import MUIAvatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";

import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import Logout from "@mui/icons-material/Logout";
import Settings from "@mui/icons-material/Settings";

import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

const DarkModeListItem = () => {
	const [darkMode, setDarkMode] = useLocalStorageState<boolean>("darkMode");

	const handleClick = () => {
		setDarkMode(!darkMode);
	};

	return (
		<MenuItem onClick={handleClick}>
			<ListItemIcon>
				{darkMode ? <DarkModeIcon /> : <LightModeIcon />}
			</ListItemIcon>
			<ListItemText>{darkMode ? "Dark mode" : "Light mode"}</ListItemText>
		</MenuItem>
	);
};

const Avatar: FunctionalComponent = () => {
	const theme = useTheme();

	const [username] = useLocalStorageState<string>("username");

	const [avatar] = useLocalStorageState<string>("avatar");

	const [, setLoggedIn] = useLocalStorageState<undefined | string>("jwtToken");

	const [menuAnchor, setMenuAnchor] = useState<Element | null>();
	const open = Boolean(menuAnchor);

	const setShowSettings = useStore((state) => state.setShowSettings);

	const logout = () => {
		setLoggedIn();
	};

	const menuItems: { title: string; icon: JSX.Element; onClick: () => void }[] =
		[
			{
				title: "Settings",
				icon: <Settings fontSize="small" />,
				onClick: () => setShowSettings(true)
			},
			{
				title: "Logout",
				icon: <Logout fontSize="small" />,
				onClick: () => logout()
			}
		];

	return (
		<>
			<IconButton
				onClick={(e: MouseEvent) => setMenuAnchor(e.currentTarget as Element)}
				sx={{ p: 0 }}
			>
				<MUIAvatar
					sx={{ bgcolor: theme.palette.secondary.main }}
					src={avatar}
					alt={username?.toUpperCase()}
				/>
			</IconButton>

			<Menu
				id="avatar menu"
				anchorEl={menuAnchor}
				open={open}
				onClose={() => setMenuAnchor(null)}
			>
				<DarkModeListItem />
				{menuItems.map((item) => (
					<MenuItem onClick={item.onClick}>
						<ListItemIcon>{item.icon}</ListItemIcon>
						<ListItemText>{item.title}</ListItemText>
					</MenuItem>
				))}
			</Menu>
		</>
	);
};

export default Avatar;

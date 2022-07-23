import useLocalStorageState from "use-local-storage-state";

import { FunctionalComponent } from "preact";

import { memo } from "preact/compat";
import { useState } from "preact/hooks";

import MUIAvatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import DarkModeIcon from "@mui/icons-material/DarkMode";
// import ComposeIcon from "@mui/icons-material/Edit";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";

import useLogout from "@utils/hooks/useLogout";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";
import useUser from "@utils/hooks/useUser";

const DarkModeListItem: FunctionalComponent = () => {
	const [darkMode, setDarkMode] = useLocalStorageState<boolean>("darkMode");

	const handleClick = (): void => {
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

const UnMemoizedAvatar: FunctionalComponent = () => {
	const theme = useTheme();

	const user = useUser();

	const logout = useLogout();

	const [menuAnchor, setMenuAnchor] = useState<Element | null>();
	const open = Boolean(menuAnchor);

	const setShowSettings = useStore((state) => state.setShowSettings);

	// const setShowMessageComposer = useStore(
	// 	(state) => state.setShowMessageComposer
	// );

	const menuItems: { title: string; icon: JSX.Element; onClick: () => void }[] =
		[
			// {
			// 	title: "New message",
			// 	icon: <ComposeIcon fontSize="small" />,
			// 	onClick: () => setShowMessageComposer(true)
			// },
			{
				title: "Settings",
				icon: <SettingsIcon fontSize="small" />,
				onClick: () => setShowSettings(true)
			},
			{
				title: "Logout",
				icon: <LogoutIcon fontSize="small" />,
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
					src={user.avatar}
					alt={user.username?.toUpperCase()}
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
					<MenuItem
						key={item.title}
						onClick={() => {
							setMenuAnchor(null);
							item.onClick();
						}}
					>
						<ListItemIcon>{item.icon}</ListItemIcon>
						<ListItemText>{item.title}</ListItemText>
					</MenuItem>
				))}
			</Menu>
		</>
	);
};

const Avatar = memo(UnMemoizedAvatar);

export default Avatar;

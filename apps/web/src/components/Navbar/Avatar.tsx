import useLocalStorageState from "use-local-storage-state";

import { FC, memo, useState, MouseEvent, useMemo } from "react";
import { useNavigate } from "react-router";

import MUIAvatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import DarkModeIcon from "@mui/icons-material/DarkMode";
// import ComposeIcon from "@mui/icons-material/Edit";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import AddAccountIcon from "@mui/icons-material/PersonAdd";
import SettingsIcon from "@mui/icons-material/Settings";

import User from "@interfaces/user";

import createAvatarUrl from "@utils/avatarUrl";
import useLogout from "@utils/hooks/useLogout";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";
import useUser, { useCurrentUser, useUsers } from "@utils/hooks/useUser";

const DarkModeListItem: FC = () => {
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

const AccountListItem: FC<{ user: User }> = ({ user }) => {
	const theme = useTheme();

	const [currentUser, setCurrentUser] = useCurrentUser();

	const avatar =
		user?.usernames.incoming !== undefined
			? createAvatarUrl(user?.usernames.incoming)
			: undefined;

	return (
		<MenuItem
			onClick={() => {
				if (currentUser?.id != user.id) {
					setCurrentUser(user.id);
				}
			}}
		>
			<ListItemIcon>
				<MUIAvatar
					sx={{
						bgcolor: theme.palette.secondary.main,
						height: theme.spacing(4),
						width: theme.spacing(4),
						mr: 1
					}}
					src={avatar}
					alt={user.usernames.incoming.toUpperCase()}
				/>
			</ListItemIcon>
			<ListItemText>{user.usernames.incoming}</ListItemText>
		</MenuItem>
	);
};

const AccountList: FC = () => {
	const [users] = useUsers();

	const [currentUser] = useCurrentUser();

	return (
		<>
			{currentUser && <AccountListItem user={currentUser} />}
			<Divider />
			{users
				?.filter((user) => user.id != currentUser?.id)
				.slice(0, 5)
				.map((user) => (
					<AccountListItem key={user.id} user={user} />
				))}
		</>
	);
};

const AddAccountListItem: FC = () => {
	const navigate = useNavigate();

	return (
		<MenuItem onClick={() => navigate("/add-account")}>
			<ListItemIcon>
				<AddAccountIcon />
			</ListItemIcon>
			<ListItemText>Add account</ListItemText>
		</MenuItem>
	);
};

const UnMemoizedAvatar: FC = () => {
	const theme = useTheme();

	const user = useUser();

	const logout = useLogout();

	const [menuAnchor, setMenuAnchor] = useState<Element | null>();
	const open = Boolean(menuAnchor);

	const setShowSettings = useStore((state) => state.setShowSettings);

	const avatar =
		user?.usernames.incoming !== undefined
			? createAvatarUrl(user?.usernames.incoming)
			: undefined;

	// const setShowMessageComposer = useStore(
	// 	(state) => state.setShowMessageComposer
	// );

	const menuItems: { title: string; icon: JSX.Element; onClick: () => void }[] =
		useMemo(
			() => [
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
			],
			[setShowSettings, logout]
		);

	return (
		<>
			<IconButton
				onClick={(e: MouseEvent) => setMenuAnchor(e.currentTarget)}
				sx={{ p: 0 }}
			>
				<MUIAvatar
					sx={{ bgcolor: theme.palette.secondary.main }}
					src={avatar}
					alt={user?.usernames.incoming.toUpperCase()}
				/>
			</IconButton>

			<Menu
				id="avatar menu"
				anchorEl={menuAnchor}
				open={open}
				onClose={() => setMenuAnchor(null)}
			>
				<AccountList />
				<AddAccountListItem />
				<Divider />
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

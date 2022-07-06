import { FunctionalComponent } from "preact";

import { memo } from "preact/compat";
import { MutableRef } from "preact/hooks";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderMoveIcon from "@mui/icons-material/DriveFileMove";
import DetailsIcon from "@mui/icons-material/Info";

import Message from "@interfaces/message";

import useAvatar from "@utils/hooks/useAvatar";
import useMessageActions from "@utils/hooks/useMessageActions";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

const UnMemoizedMessageListItem: FunctionalComponent<{
	message: Message;
	selectedMessage: boolean;
	unSeen?: boolean;
	rightClickMenuBox: MutableRef<null>;
	rightClickMenuOpen: boolean;
	setRightClickMenuAnchor: (anchor: {
		x: number;
		y: number;
		id?: string;
	}) => void;
}> = ({
	message,
	selectedMessage,
	unSeen,
	rightClickMenuBox,
	rightClickMenuOpen,
	setRightClickMenuAnchor
}) => {
	const theme = useTheme();

	const messageActions = useMessageActions(message.id);

	let from = message.from
		.map((from) => from.displayName || from.email)
		.join(", ");

	const setSelectedMessage = useStore((state) => state.setSelectedMessage);

	const avatar = useAvatar(from.length != 0 ? message.from[0].email : null);

	if (unSeen === undefined)
		unSeen = !message.flags.find((flag) => flag.match(/Seen/));

	const handleClick = () => {
		if (!message.id) return;
		if (selectedMessage) setSelectedMessage();
		else setSelectedMessage({ id: message.id, flags: message.flags });
	};

	const handleContextMenu = (e: MouseEvent) => {
		e.preventDefault();

		setRightClickMenuAnchor({ x: e.x, y: e.y, id: message.id });
	};

	const handleMenuClose = () => setRightClickMenuAnchor({ x: 0, y: 0 });

	return (
		<>
			{rightClickMenuOpen && (
				<Menu
					id="message-context-menu"
					open={rightClickMenuOpen}
					onClose={handleMenuClose}
					anchorEl={rightClickMenuBox?.current}
					MenuListProps={{
						"aria-labelledby": "message-context-menu-button"
					}}
				>
					{messageActions.map((action) => (
						<MenuItem
							onClick={() => {
								handleMenuClose();
								action.handler();
							}}
						>
							<ListItemIcon>{action.icon}</ListItemIcon>
							<ListItemText>{action.name}</ListItemText>
						</MenuItem>
					))}

					<MenuItem onClick={handleMenuClose}>
						<ListItemIcon>
							<CloseIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Close</ListItemText>
					</MenuItem>
				</Menu>
			)}

			<Card
				onClick={handleClick}
				onContextMenu={handleContextMenu}
				sx={{
					my: 1,
					cursor: "pointer"
				}}
				key={message.id}
				raised={selectedMessage}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "left",
						alignItems: "center"
					}}
				>
					{unSeen && (
						<Box
							sx={{
								width: theme.spacing(1),
								height: theme.spacing(9),
								bgcolor: theme.palette.secondary.light
							}}
						></Box>
					)}
					<Box sx={{ m: 2 }}>
						{avatar?.isLoading ? (
							<Skeleton variant="rectangular">
								<Avatar />
							</Skeleton>
						) : (
							<Avatar
								sx={{
									bgcolor: !avatar?.data ? theme.palette.secondary.main : null
								}}
								variant="rounded"
								src={avatar?.data}
								alt={from.charAt(0).toUpperCase()}
							>
								{!avatar?.data && from.charAt(0).toUpperCase()}
							</Avatar>
						)}
					</Box>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography noWrap textOverflow="ellipsis" variant="body2">
							{from || "(Unknown sender)"} •{" "}
							{new Date(message.date).toLocaleDateString()}
						</Typography>
						<Typography
							noWrap
							textOverflow="ellipsis"
							variant="h6"
							sx={{ fontWeight: unSeen ? "bold" : null }}
						>
							{!message.subject ||
							(message.subject && message.subject.length == 0)
								? "(No subject)"
								: message.subject}
						</Typography>
						{/* <Typography variant="caption">
						
					</Typography> */}
					</Box>
				</Box>
			</Card>
		</>
	);
};

const MessageListItem = memo(UnMemoizedMessageListItem);

export default MessageListItem;

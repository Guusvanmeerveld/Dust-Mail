import { FC, memo, MouseEvent, MutableRefObject, useState } from "react";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

import CloseIcon from "@mui/icons-material/Close";

import { IncomingMessage } from "@dust-mail/typings/message";

import useAvatar from "@utils/hooks/useAvatar";
import useMessageActions from "@utils/hooks/useMessageActions";
import useSelectedMessage from "@utils/hooks/useSelectedMessage";
import useTheme from "@utils/hooks/useTheme";

const UnMemoizedMessageListItem: FC<{
	message: IncomingMessage;
	selectedMessage: boolean;
	rightClickMenuBox: MutableRefObject<null>;
	rightClickMenuOpen: boolean;
	setRightClickMenuAnchor: (anchor: {
		x: number;
		y: number;
		id?: string;
	}) => void;
}> = ({
	message,
	selectedMessage,
	rightClickMenuBox,
	rightClickMenuOpen,
	setRightClickMenuAnchor
}) => {
	const theme = useTheme();

	const [unSeen, setUnSeen] = useState(!message.flags.seen);

	const messageActions = useMessageActions(message.id);

	const [, setSelectedMessage] = useSelectedMessage();

	const from = message.from
		.map((from) => from.displayName || from.email)
		.join(", ");

	const avatar = useAvatar(
		from.length != 0 ? message.from[0].email : undefined
	);

	const handleClick = (): void => {
		if (!message.id) return;

		setUnSeen(false);

		if (selectedMessage) setSelectedMessage();
		else setSelectedMessage(message.id);
	};

	const handleContextMenu = (e: MouseEvent): void => {
		e.preventDefault();

		setRightClickMenuAnchor({ x: e.screenX, y: e.screenY, id: message.id });
	};

	const handleMenuClose = (): void => setRightClickMenuAnchor({ x: 0, y: 0 });

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
							key={action.name}
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

			<Box
				onClick={handleClick}
				onContextMenu={handleContextMenu}
				sx={{
					cursor: "pointer",
					backgroundImage: selectedMessage
						? "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))"
						: null,

					borderBottom: `${theme.palette.divider} 1px solid`
				}}
				key={message.id}
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
								width: theme.spacing(0.5),
								height: theme.spacing(9),
								bgcolor: theme.palette.secondary.light
							}}
						></Box>
					)}
					<Box sx={{ m: 2, ml: 3 }}>
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
					<Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
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
			</Box>
		</>
	);
};

const MessageListItem = memo(UnMemoizedMessageListItem);

export default MessageListItem;

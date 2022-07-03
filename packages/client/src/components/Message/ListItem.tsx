import { FunctionalComponent } from "preact";

import { memo } from "preact/compat";
import { MutableRef, useRef, useState } from "preact/hooks";

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

import useStore from "@utils/createStore";
import useTheme from "@utils/hooks/useTheme";
import useAvatar from "@utils/useAvatar";

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

	let from = message.from
		.map((from) => from.displayName || from.email)
		.join(", ");

	const setSelectedMessage = useStore((state) => state.setSelectedMessage);

	const { data: avatar, isLoading: isLoadingAvatar } = useAvatar(
		message.from[0].email
	);

	if (unSeen === undefined)
		unSeen = !message.flags.find((flag) => flag.match(/Seen/));

	const handleClick = () => {
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
					<MenuItem onClick={handleMenuClose}>
						<ListItemIcon>
							<FolderMoveIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Move to</ListItemText>
					</MenuItem>

					<MenuItem onClick={handleMenuClose}>
						<ListItemIcon>
							<DeleteIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Delete</ListItemText>
					</MenuItem>

					<MenuItem onClick={handleMenuClose}>
						<ListItemIcon>
							<DetailsIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Details</ListItemText>
					</MenuItem>

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
						{isLoadingAvatar ? (
							<Skeleton variant="rectangular">
								<Avatar />
							</Skeleton>
						) : (
							<Avatar
								sx={{ bgcolor: !avatar ? theme.palette.secondary.main : null }}
								variant="rounded"
								// imgProps={{ onError: () =>  }}
								src={avatar}
								alt={from.charAt(0).toLocaleUpperCase()}
							>
								{!avatar && from.charAt(0).toLocaleUpperCase()}
							</Avatar>
						)}
					</Box>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography noWrap textOverflow="ellipsis" variant="body2">
							{from} • {new Date(message.date).toLocaleDateString()}
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

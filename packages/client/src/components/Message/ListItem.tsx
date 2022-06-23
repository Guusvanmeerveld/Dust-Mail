import { FunctionalComponent } from "preact";

import { memo } from "preact/compat";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

import Message from "@interfaces/message";

import useStore from "@utils/createStore";
import useTheme from "@utils/hooks/useTheme";
import useAvatar from "@utils/useAvatar";

const UnMemoizedMessageListItem: FunctionalComponent<{
	message: Message;
	selectedMessage: boolean;
}> = ({ message, selectedMessage }) => {
	const theme = useTheme();

	let from = message.from
		.map((from) => from.displayName || from.email)
		.join(", ");

	const setSelectedMessage = useStore((state) => state.setSelectedMessage);

	const avatar = useAvatar(message.from[0].email);

	const unSeen = !message.flags.find((flag) => flag.match(/Seen/));

	return (
		<Card
			onClick={() =>
				selectedMessage ? setSelectedMessage() : setSelectedMessage(message.id)
			}
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
					<Avatar
						sx={{ bgcolor: !avatar ? theme.palette.secondary.main : null }}
						variant="rounded"
						// imgProps={{ onError: () =>  }}
						src={avatar}
						alt={from.charAt(0).toLocaleUpperCase()}
					>
						{!avatar && from.charAt(0).toLocaleUpperCase()}
					</Avatar>
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
	);
};

const MessageListItem = memo(UnMemoizedMessageListItem);

export default MessageListItem;

import { FunctionalComponent } from "preact";

import { memo, useEffect } from "preact/compat";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

import Message from "@shared/message";

import useStore from "@utils/createStore";
import useTheme from "@utils/hooks/useTheme";

const UnMemoizedMessageListItem: FunctionalComponent<{
	message: Message;
	selectedMessage: boolean;
}> = ({ message, selectedMessage }) => {
	const theme = useTheme();

	let from = message.from.map((from) => from.displayName).join(", ");
	if (from == "") from = message.from.map((from) => from.email).join(", ");

	const avatar = message.from[0].avatar;

	const setSelectedMessage = useStore((state) => state.setSelectedMessage);

	return (
		<Card
			onClick={() =>
				selectedMessage ? setSelectedMessage() : setSelectedMessage(message.id)
			}
			sx={{ p: 1, my: 1, cursor: "pointer" }}
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
				<Box>
					<Avatar
						sx={{ bgcolor: theme.palette.secondary.main }}
						variant="rounded"
						// imgProps={{ onError: () =>  }}
						src={avatar}
						alt={from.toUpperCase()}
					/>
				</Box>
				<Box sx={{ ml: 2, flex: 1 }}>
					<Typography noWrap textOverflow="ellipsis" variant="body2">
						{from} • {new Date(message.date).toLocaleDateString()}
					</Typography>
					<Typography noWrap textOverflow="ellipsis" variant="h6">
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

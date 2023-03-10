import { FC, memo, MouseEvent, useMemo, useState } from "react";

import { Preview } from "@dust-mail/structures";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import createAvatarUrl from "@utils/avatarUrl";
import { useSetSelectedMessage } from "@utils/hooks/useSelectedMessage";
import useTheme from "@utils/hooks/useTheme";

// interface Message {
// 	id: string;
// 	seen: boolean;
// }

// interface UnSeenMessagesStore {
// 	messages: Message[];
// 	addMessage: (msg: Message) => void;
// 	setSeen: (id: string, seen: boolean) => void;
// 	isSeen: (id: string) => void;
// }

// export const unSeenMessagesStore = create<UnSeenMessagesStore>((set) => ({
// 	messages: [],
// 	addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
// 	setSeen: (id, seen) =>
// 		set((state) => ({
// 			messages: [...state.messages.filter((msg) => msg.id != id), { id, seen }]
// 		})),
// 		isSeen: (id) =>
// }));

const UnMemoizedMessageListItem: FC<{
	message: Preview;
	selectedMessage: boolean;
	setRightClickMenuAnchor: (anchor: {
		x: number;
		y: number;
		id?: string;
	}) => void;
}> = ({ message, selectedMessage, setRightClickMenuAnchor }) => {
	const theme = useTheme();

	const setSelectedMessage = useSetSelectedMessage();

	const [unSeen, setUnSeen] = useState(!message.flags.includes("Read"));

	const from = useMemo(
		() => message.from.map((from) => from.name || from.address).join(", "),
		[message]
	);

	const primarySender = message.from[0] ?? null;

	const avatar =
		primarySender?.address !== null
			? createAvatarUrl(primarySender.address)
			: undefined;

	const handleClick = useMemo(
		() => (): void => {
			if (!message.id) return;

			setUnSeen(false);

			if (selectedMessage) setSelectedMessage();
			else setSelectedMessage(message.id);
		},
		[message.id, selectedMessage]
	);

	const handleContextMenu = useMemo(
		() =>
			(e: MouseEvent): void => {
				e.preventDefault();

				setRightClickMenuAnchor({ x: e.pageX, y: e.pageY, id: message.id });
			},
		[setRightClickMenuAnchor]
	);

	return (
		<>
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
						<Avatar
							sx={{
								bgcolor: theme.palette.secondary.main
							}}
							variant="rounded"
							src={avatar}
							alt={from.charAt(0).toUpperCase()}
						/>
					</Box>
					<Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
						<Typography noWrap textOverflow="ellipsis" variant="body2">
							{from || "(Unknown sender)"} •{" "}
							{new Date((message.sent ?? 0) * 1000).toLocaleDateString()}
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

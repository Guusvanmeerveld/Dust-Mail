import useLocalStorageState from "use-local-storage-state";

import { useEffect, useRef, useState, memo, FC, MouseEvent } from "react";
import { useQuery } from "react-query";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import CloseIcon from "@mui/icons-material/Close";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import HideImageIcon from "@mui/icons-material/HideImage";
import ImageIcon from "@mui/icons-material/Image";
import LightModeIcon from "@mui/icons-material/LightMode";
import MoreIcon from "@mui/icons-material/MoreHoriz";

import { Address, FullMessage } from "@interfaces/message";

import scrollbarStyles from "@styles/scrollbar";

import useAvatar from "@utils/hooks/useAvatar";
import useFetch from "@utils/hooks/useFetch";
import useMessageActions from "@utils/hooks/useMessageActions";
import useSelectedBox from "@utils/hooks/useSelectedBox";
import useSelectedMessage from "@utils/hooks/useSelectedMessage";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

const AddressList: FC<{
	data: Address[];
	prefixText: string;
}> = ({ data, prefixText }) => {
	const theme = useTheme();

	return (
		<Stack direction="row" alignItems="center" spacing={2}>
			<Typography>{prefixText}</Typography>
			{data &&
				data.map((address) => {
					// eslint-disable-next-line react-hooks/rules-of-hooks
					const { data: avatar } = useAvatar(address.email);

					const name = address.displayName || address.email;

					return (
						<Chip
							key={address.email}
							avatar={
								<Avatar
									sx={{
										mr: 2,
										bgcolor: !avatar ? theme.palette.secondary.main : null
									}}
									src={avatar}
									alt={name.charAt(0).toUpperCase()}
								>
									{!avatar && name.charAt(0).toLocaleUpperCase()}
								</Avatar>
							}
							label={
								name == address.email ? name : `${name} <${address.email}>`
							}
						/>
					);
				})}
		</Stack>
	);
};

const MessageDisplay: FC<{ content: string }> = ({ content }) => {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		const document = iframeRef.current?.contentDocument;

		document?.open();

		document?.write(content);

		document?.close();
	}, [content]);

	return (
		<iframe
			title="message-iframe"
			style={{
				width: "100%",
				height: "100%",
				border: "none",
				backgroundColor: "#fff"
			}}
			ref={iframeRef}
		/>
	);
};

const UnMemoizedMessageOverview: FC = () => {
	const theme = useTheme();

	const fetcher = useFetch();

	const [selectedMessage, setSelectedMessage] = useSelectedMessage();
	const [selectedBox] = useSelectedBox();

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const messageActions = useMessageActions(selectedMessage!);

	const setFetching = useStore((state) => state.setFetching);

	// const setShowMessageComposer = useStore(
	// 	(state) => state.setShowMessageComposer
	// );

	const [darkMode, setDarkMode] = useLocalStorageState<boolean>(
		"messageDarkMode",
		{ defaultValue: false }
	);

	const [showImages, setShowImages] = useState(false);

	const [messageActionsAnchor, setMessageActionsAnchor] =
		useState<null | Element>(null);
	const messageActionsAnchorOpen = Boolean(messageActionsAnchor);

	const { data, isFetching } = useQuery<FullMessage>(
		["message", selectedMessage, selectedBox?.id],
		() =>
			fetcher
				.get("/mail/message", {
					params: {
						id: selectedMessage,
						box: selectedBox?.id,
						markRead: true
					}
				})
				.then(({ data }) => data),
		{ enabled: selectedMessage != undefined }
	);

	useEffect(() => setFetching(isFetching), [isFetching]);

	return (
		<>
			{selectedMessage && (
				<>
					<Card
						sx={{
							p: 2,
							flexShrink: 0
						}}
					>
						<Stack direction="row">
							<Stack direction="column" sx={{ flex: 1 }} spacing={2}>
								<Box>
									<Typography variant="h5">
										{isFetching || !data ? (
											<Skeleton />
										) : (
											data.subject ?? "(No subject)"
										)}
									</Typography>
									<Typography
										variant="subtitle1"
										color={theme.palette.text.secondary}
									>
										{isFetching || !data ? (
											<Skeleton />
										) : (
											`${new Date(data.date).toLocaleDateString()} - ${new Date(
												data.date
											).toLocaleTimeString()}`
										)}
									</Typography>
								</Box>
								{data?.from && (
									<AddressList data={data.from} prefixText="From:" />
								)}
								{data?.to && <AddressList data={data.to} prefixText="To:" />}
								{data?.cc && <AddressList data={data.cc} prefixText="CC:" />}
								{data?.bcc && <AddressList data={data.bcc} prefixText="BCC:" />}
							</Stack>

							<Stack direction="column" spacing={0.5}>
								<Tooltip title="Close current message">
									<IconButton onClick={() => setSelectedMessage()}>
										<CloseIcon />
									</IconButton>
								</Tooltip>
								<Tooltip title="Toggle dark mode for message view">
									<IconButton onClick={() => setDarkMode(() => !darkMode)}>
										{darkMode ? <DarkModeIcon /> : <LightModeIcon />}
									</IconButton>
								</Tooltip>
								<Tooltip title="Toggle images in message view">
									<IconButton onClick={() => setShowImages((state) => !state)}>
										{showImages ? <ImageIcon /> : <HideImageIcon />}
									</IconButton>
								</Tooltip>
								<Tooltip title="Message actions">
									<IconButton
										onClick={(e: MouseEvent) =>
											setMessageActionsAnchor(e.currentTarget as Element)
										}
									>
										<MoreIcon />
									</IconButton>
								</Tooltip>
								<Menu
									id="message-actions-menu"
									anchorEl={messageActionsAnchor}
									open={messageActionsAnchorOpen}
									onClose={() => setMessageActionsAnchor(null)}
									MenuListProps={{
										"aria-labelledby": "basic-button"
									}}
								>
									{messageActions.map((action) => (
										<MenuItem
											key={action.name}
											onClick={() => {
												setMessageActionsAnchor(null);
												action.handler();
											}}
										>
											<ListItemIcon>{action.icon}</ListItemIcon>
											<ListItemText>{action.name}</ListItemText>
										</MenuItem>
									))}
								</Menu>
							</Stack>
						</Stack>
					</Card>
					<Card
						sx={{
							...scrollbarStyles(theme),
							overflowY: "scroll",
							p: data?.content?.type == "text" ? 2 : 0,
							flexGrow: 1
						}}
					>
						{(isFetching || !data) && (
							<Skeleton
								animation="wave"
								sx={{ height: "100%" }}
								variant="rectangular"
							/>
						)}
						{!isFetching && data?.content && (
							<>
								{data.content.type == "text" && (
									<Box
										sx={{}}
										dangerouslySetInnerHTML={{
											__html: data.content.html ?? ""
										}}
									/>
								)}
								{data.content.type == "html" && (
									<MessageDisplay content={data.content.html as string} />
								)}
							</>
						)}
					</Card>
				</>
			)}
			{!selectedMessage && (
				<Box>
					<Typography variant="h6">No message selected.</Typography>
					<Typography>
						Get started by selecting a message on the left.
					</Typography>
					{/* <Typography>
						Or start by{" "}
						<Link
							sx={{ cursor: "pointer" }}
							onClick={() => setShowMessageComposer(true)}
						>
							composing a new message
						</Link>
						.
					</Typography> */}
				</Box>
			)}
		</>
	);
};

const MessageOverview = memo(UnMemoizedMessageOverview);

export default MessageOverview;

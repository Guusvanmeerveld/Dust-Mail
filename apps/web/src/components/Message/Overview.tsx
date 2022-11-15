import useLocalStorageState from "use-local-storage-state";

import { useEffect, useRef, useState, memo, FC, MouseEvent } from "react";

import { Address, Attachment } from "@dust-mail/typings";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
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
import BrowserIcon from "@mui/icons-material/Language";
import LightModeIcon from "@mui/icons-material/LightMode";
import MoreIcon from "@mui/icons-material/MoreHoriz";

import scrollbarStyles from "@styles/scrollbar";

import useAvatar from "@utils/hooks/useAvatar";
import useHttpClient from "@utils/hooks/useFetch";
import useMessageActions from "@utils/hooks/useMessageActions";
import useSelectedMessage, {
	useSetSelectedMessage
} from "@utils/hooks/useSelectedMessage";
import useTheme from "@utils/hooks/useTheme";

const AddressListItem: FC<{ email: string; displayName: string }> = ({
	email,
	displayName
}) => {
	const theme = useTheme();

	const avatar = useAvatar(email);

	const name = displayName || email;

	return (
		<Chip
			sx={{
				mr: 1,
				mb: 1,
				maxWidth: { xs: theme.spacing(35), md: theme.spacing(50) }
			}}
			avatar={
				<Avatar
					sx={{
						mr: 2,
						bgcolor: !avatar ? theme.palette.secondary.main : null
					}}
					src={avatar?.data}
					alt={name.charAt(0).toUpperCase()}
				>
					{!avatar?.data && name.charAt(0).toLocaleUpperCase()}
				</Avatar>
			}
			label={name == email ? name : `${name} <${email}>`}
		/>
	);
};

const ADDRESSES_TO_SHOW = 3;

const AddressList: FC<{
	data: Address[];
	prefixText: string;
}> = ({ data, prefixText }) => {
	const [showMore, setShowMore] = useState(false);

	return (
		<Box sx={{ alignItems: "center" }}>
			<Typography sx={{ display: "inline", mr: 1 }}>{prefixText}</Typography>
			{data &&
				data
					.slice(0, showMore ? data.length : ADDRESSES_TO_SHOW)
					.map((address, i) => (
						<AddressListItem {...address} key={address.email + i} />
					))}
			{data && data.length > ADDRESSES_TO_SHOW && (
				<Link
					onClick={() => setShowMore((state) => !state)}
					sx={{ cursor: "pointer" }}
				>
					{showMore ? "Hide" : `And ${data.length - ADDRESSES_TO_SHOW} more`}
				</Link>
			)}
		</Box>
	);
};

const MessageDisplay: FC<{ content: string }> = ({ content }) => {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		const document =
			iframeRef.current?.contentDocument ||
			iframeRef.current?.contentWindow?.document;

		// iframeRef.current?.contentWindow?.addEventListener("message", console.log);

		document?.open();

		document?.write(content);

		document?.close();

		// return () =>
		// 	iframeRef.current?.contentWindow?.removeEventListener(
		// 		"message",
		// 		console.log
		// 	);
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

const CloseButton: FC = () => {
	const setSelectedMessage = useSetSelectedMessage();

	return (
		<Tooltip title="Close current message">
			<IconButton onClick={() => setSelectedMessage()}>
				<CloseIcon />
			</IconButton>
		</Tooltip>
	);
};

const AttachmentList: FC<{
	attachments: Attachment[];
}> = ({ attachments }) => {
	const [backendServer] = useLocalStorageState("customServerUrl");

	return (
		<>
			{attachments.map((attachment) => {
				let url;
				if (attachment.token)
					url = `${backendServer}/mail/message/attachment?token=${attachment.token}`;

				return (
					<Link href={url} sx={{ mr: 2 }} key={attachment.id}>
						{attachment.name}
					</Link>
				);
			})}
		</>
	);
};

const UnMemoizedMessageOverview: FC = () => {
	const theme = useTheme();

	const {
		selectedMessage: data,
		selectedMessageError: error,
		selectedMessageFetching: isFetching
	} = useSelectedMessage();

	const messageActions = useMessageActions();

	// const setShowMessageComposer = useStore(
	// 	(state) => state.setShowMessageComposer
	// );

	const [darkMode, setDarkMode] =
		useLocalStorageState<boolean>("messageDarkMode");

	const [showImages, setShowImages] =
		useLocalStorageState<boolean>("showImages");

	const [messageActionsAnchor, setMessageActionsAnchor] =
		useState<null | Element>(null);
	const messageActionsAnchorOpen = Boolean(messageActionsAnchor);

	return (
		<>
			{data && (
				<>
					<Card
						sx={{
							p: 2,
							flexShrink: 0
						}}
					>
						<Stack direction="row">
							<>
								{error && (
									<Stack direction="column" sx={{ flex: 1 }} spacing={2}>
										{error.response?.data?.message ?? "Unknown error"}
									</Stack>
								)}
								{data && !error && (
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
													`${new Date(
														data.date
													).toLocaleDateString()} - ${new Date(
														data.date
													).toLocaleTimeString()}`
												)}
											</Typography>
										</Box>
										{data?.from && data?.from.length != 0 && (
											<AddressList data={data.from} prefixText="From:" />
										)}
										{data?.to && data?.to.length != 0 && (
											<AddressList data={data.to} prefixText="To:" />
										)}
										{data?.cc && data?.cc.length != 0 && (
											<AddressList data={data.cc} prefixText="CC:" />
										)}
										{data?.bcc && data?.bcc.length != 0 && (
											<AddressList data={data.bcc} prefixText="BCC:" />
										)}
										{data?.attachments && data.attachments.length != 0 && (
											<AttachmentList attachments={data.attachments} />
										)}
									</Stack>
								)}

								<Stack direction="column" spacing={0.5}>
									<CloseButton />

									<Tooltip title="Toggle dark mode for message view">
										<IconButton onClick={() => setDarkMode(() => !darkMode)}>
											{darkMode ? <DarkModeIcon /> : <LightModeIcon />}
										</IconButton>
									</Tooltip>
									<Tooltip title="Toggle images in message view">
										<IconButton
											onClick={() => setShowImages((state) => !state)}
										>
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
										<MenuItem
											onClick={() => {
												setMessageActionsAnchor(null);
												const webview = window.open(
													"",
													data.subject,
													"height=200,width=150"
												);

												webview?.document.write(data.content.html ?? "");
											}}
										>
											<ListItemIcon>
												<BrowserIcon />
											</ListItemIcon>
											<ListItemText>Open in new window</ListItemText>
										</MenuItem>
										{messageActions.map((action) => (
											<MenuItem
												key={action.name}
												onClick={() => {
													setMessageActionsAnchor(null);
													action.handler(data);
												}}
											>
												<ListItemIcon>{action.icon}</ListItemIcon>
												<ListItemText>{action.name}</ListItemText>
											</MenuItem>
										))}
									</Menu>
								</Stack>
							</>
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
								{data.content.html && (
									<>
										{data.content.type == "text" && (
											<Box
												dangerouslySetInnerHTML={{
													__html: data.content.html
												}}
											/>
										)}
										{data.content.type == "html" && (
											<MessageDisplay content={data.content.html} />
										)}
									</>
								)}
								{!data.content.html && (
									<Typography sx={{ m: 1 }}>No message content</Typography>
								)}
							</>
						)}
					</Card>
				</>
			)}

			<Box sx={{ display: !data ? "block" : "none" }}>
				<Typography variant="h6">No message selected.</Typography>
				<Typography>Get started by selecting a message on the left.</Typography>
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
		</>
	);
};

const MessageOverview = memo(UnMemoizedMessageOverview);

export default MessageOverview;

import useLocalStorageState from "use-local-storage-state";

import { useQuery } from "react-query";

import { FunctionalComponent } from "preact";

import { memo } from "preact/compat";
import { useEffect, useRef, useState } from "preact/hooks";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import CloseIcon from "@mui/icons-material/Close";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import HideImageIcon from "@mui/icons-material/HideImage";
import ImageIcon from "@mui/icons-material/Image";
import LightModeIcon from "@mui/icons-material/LightMode";

import { Address, FullMessage } from "@interfaces/message";

import useAvatar from "@utils/hooks/useAvatar";
import useFetch from "@utils/hooks/useFetch";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

const AddressList: FunctionalComponent<{
	data: Address[];
	prefixText: string;
}> = ({ data, prefixText }) => {
	const theme = useTheme();

	return (
		<Stack direction="row" alignItems="center" spacing={2}>
			<Typography>{prefixText}</Typography>
			{data &&
				data.map((address) => {
					const { data: avatar } = useAvatar(address.email);

					const name = address.displayName || address.email;

					return (
						<Chip
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

const MessageDisplay: FunctionalComponent<{ content: string }> = ({
	content
}) => {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		const document = iframeRef.current?.contentDocument;

		document?.open();

		document?.write(content);

		document?.close();
	}, [content]);

	return (
		<iframe
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

const UnMemoizedMessageOverview: FunctionalComponent = () => {
	const theme = useTheme();

	const fetcher = useFetch();

	const selectedMessage = useStore((state) => state.selectedMessage);
	const selectedBox = useStore((state) => state.selectedBox);

	const setSelectedMessage = useStore((state) => state.setSelectedMessage);

	const setFetching = useStore((state) => state.setFetching);

	const [darkMode, setDarkMode] = useLocalStorageState<boolean>(
		"messageDarkMode",
		{ defaultValue: false }
	);

	const [showImages, setShowImages] = useState(false);

	const { data, error, isFetching } = useQuery<FullMessage>(
		["message", selectedMessage?.id],
		() =>
			fetcher
				.get("/mail/message", {
					params: {
						id: selectedMessage?.id,
						box: selectedBox?.id,
						markRead: true
					}
				})
				.then(({ data }) => data),
		{ enabled: selectedMessage != undefined }
	);

	useEffect(() => setFetching(isFetching), [isFetching]);

	// useEffect(() => {
	// 	if (data) setSelectedMessage({ id: data.id, flags: data.flags });
	// }, [data?.id]);

	return (
		<>
			{selectedMessage && (
				<>
					<Card sx={{ p: 2 }}>
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
							</Stack>
						</Stack>
					</Card>
					<Card sx={{ p: data?.content?.type == "text" ? 2 : 0, flexGrow: 2 }}>
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
										dangerouslySetInnerHTML={{
											__html: data.content.html
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
				</Box>
			)}
		</>
	);
};

const MessageOverview = memo(UnMemoizedMessageOverview);

export default MessageOverview;

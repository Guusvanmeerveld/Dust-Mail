import { useQuery } from "react-query";

import { FunctionalComponent } from "preact";

import { memo } from "preact/compat";
import { useEffect, useRef } from "preact/hooks";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { Address, FullMessage } from "@interfaces/message";

import useFetch from "@utils/axiosClient";
import useStore from "@utils/createStore";
import useTheme from "@utils/hooks/useTheme";
import useAvatar from "@utils/useAvatar";

const AddressList: FunctionalComponent<{
	data: Address[];
	prefixText: string;
}> = ({ data, prefixText }) => {
	const theme = useTheme();

	return (
		<Stack direction="row" alignItems="center" spacing={2}>
			<Typography>{prefixText}</Typography>
			{data.map((address) => {
				const avatar = useAvatar(address.email);

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
						label={name == address.email ? name : `${name} <${address.email}>`}
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
	const fetcher = useFetch();

	const selectedMessage = useStore((state) => state.selectedMessage);
	const selectedBox = useStore((state) => state.selectedBox);

	const setSelectedMessage = useStore((state) => state.setSelectedMessage);

	const { data, isFetching } = useQuery<FullMessage>(
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

	// useEffect(() => {
	// 	if (data) setSelectedMessage({ id: data.id, flags: data.flags });
	// }, [data?.id]);

	return (
		<>
			{isFetching && !data && (
				<Box
					sx={{
						width: "100%",
						display: "flex",
						justifyContent: "center"
					}}
				>
					<CircularProgress />
				</Box>
			)}

			{selectedMessage && data && (
				<>
					<Card sx={{ p: 2 }}>
						<Stack direction="column" spacing={2}>
							<Typography variant="h5">
								{data.subject ?? "(No subject)"}
							</Typography>
							{data.from && <AddressList data={data.from} prefixText="From:" />}
							{data.to && <AddressList data={data.to} prefixText="To:" />}
							{data.cc && <AddressList data={data.cc} prefixText="CC:" />}
							{data.bcc && <AddressList data={data.bcc} prefixText="BCC:" />}
						</Stack>
					</Card>
					<Card sx={{ p: data.content.type == "text" ? 2 : 0, flexGrow: 2 }}>
						{data.content.type == "text" && (
							<Box
								dangerouslySetInnerHTML={{
									__html: data.content.html
								}}
							></Box>
						)}
						{data.content.type == "html" && (
							<MessageDisplay content={data.content.html as string} />
						)}
					</Card>
				</>
			)}
			{!selectedMessage && <div>no yeet</div>}
		</>
	);
};

const MessageOverview = memo(UnMemoizedMessageOverview);

export default MessageOverview;

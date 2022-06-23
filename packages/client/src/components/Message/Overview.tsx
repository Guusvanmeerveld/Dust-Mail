import { useQuery } from "react-query";
import sanitizeHtml from "sanitize-html";

import { FunctionalComponent } from "preact";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { FullMessage } from "@interfaces/message";

import useFetch from "@utils/axiosClient";
import useStore from "@utils/createStore";
import useAvatar from "@utils/useAvatar";

const MessageOverview: FunctionalComponent = () => {
	const fetcher = useFetch();

	const selectedMessage = useStore((state) => state.selectedMessage);
	const selectedBox = useStore((state) => state.selectedBox);

	const setSelectedMessage = useStore((state) => state.setSelectedMessage);

	const { data, isFetching } = useQuery<FullMessage>(
		["message", selectedMessage],
		() =>
			fetcher
				.get("/mail/message", {
					params: { id: selectedMessage, box: selectedBox?.id }
				})
				.then(({ data }) => data),
		{ enabled: selectedMessage != undefined }
	);

	return (
		<>
			{isFetching && (
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
					<Card sx={{ mb: 2, p: 2 }}>
						{data.from.map((from) => {
							const avatar = useAvatar(from.email);

							const name = from.displayName || from.email;

							return (
								<Box sx={{ display: "flex", alignItems: "center" }}>
									<Avatar
										sx={{ mr: 2 }}
										variant="rounded"
										src={avatar}
										alt={name.charAt(0).toUpperCase()}
									>
										{!avatar && name.charAt(0).toLocaleUpperCase()}
									</Avatar>
									<Tooltip title={from.email}>
										<Typography>{name}</Typography>
									</Tooltip>
								</Box>
							);
						})}
					</Card>
					<Card sx={{ p: 2 }}>
						<Box
							sx={{ textAlign: "center" }}
							dangerouslySetInnerHTML={{
								__html: sanitizeHtml(
									data.content.html ? data.content.html : data.content.text,
									{
										allowedTags: sanitizeHtml.defaults.allowedTags.concat([
											"img"
										])
									}
								)
							}}
						></Box>
					</Card>
				</>
			)}
			{!selectedMessage && <div>no yeet</div>}
		</>
	);
};

export default MessageOverview;

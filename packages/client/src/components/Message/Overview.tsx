import { useQuery } from "react-query";
import sanitizeHtml from "sanitize-html";

import { FunctionalComponent } from "preact";

import Card from "@mui/material/Card";

import { FullMessage } from "@interfaces/message";

import useFetch from "@utils/axiosClient";
import useStore from "@utils/createStore";

const MessageOverview: FunctionalComponent = () => {
	const fetcher = useFetch();

	const selectedMessage = useStore((state) => state.selectedMessage);
	const selectedBox = useStore((state) => state.selectedBox);

	const setSelectedMessage = useStore((state) => state.setSelectedMessage);

	const { data } = useQuery<FullMessage>(
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
		<Card sx={{ p: 2, position: "fixed" }}>
			{selectedMessage && data && (
				<div
					dangerouslySetInnerHTML={{
						__html: sanitizeHtml(
							data.content.html ? data.content.html : data.content.text,
							{
								allowedTags: sanitizeHtml.defaults.allowedTags.concat([
									"img",
									"style"
								])
							}
						)
					}}
				></div>
			)}
			{!selectedMessage && <div>no yeet</div>}
		</Card>
	);
};

export default MessageOverview;

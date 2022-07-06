import { useInfiniteQuery } from "react-query";

import { FunctionalComponent } from "preact";

import { memo } from "preact/compat";
import { useRef, useState } from "preact/hooks";

import { AxiosError } from "axios";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import Error from "@interfaces/error";
import Message from "@interfaces/message";

import useFetch from "@utils/hooks/useFetch";
import useStore from "@utils/hooks/useStore";

import Loading from "@components/Loading";
import MessageListItem from "@components/Message/ListItem";

const UnMemoizedMessageList: FunctionalComponent = () => {
	const fetcher = useFetch();

	// The amount of messages to load per request
	const messageCountForPage = import.meta.env.VITE_MESSAGE_COUNT_PAGE ?? 20;

	const selectedBox = useStore((state) => state.selectedBox);

	const selectedMessage = useStore((state) => state.selectedMessage);

	// Request the messages using react-query
	const { data, error, fetchNextPage, isFetching, isFetchingNextPage } =
		useInfiniteQuery<Message[], AxiosError<{ code: Error; message: string }>>(
			["box", selectedBox?.id],
			({ pageParam = 0 }) => {
				if (pageParam === false) {
					return [];
				}

				return fetcher
					.get("/mail/box", {
						params: {
							cursor: pageParam,
							limit: messageCountForPage,
							box: selectedBox?.id
						}
					})
					.then((res) => res.data);
			},
			{
				getNextPageParam: (lastPage, pages) => {
					const morePagesExist = lastPage?.length === messageCountForPage;

					if (!morePagesExist) return false;

					return pages.length;
				},
				enabled: selectedBox != undefined
			}
		);

	const rightClickMenuBox = useRef(null);

	const [rightClickMenuAnchor, setRightClickMenuAnchor] = useState<{
		x: number;
		y: number;
		id?: string;
	}>({ x: 0, y: 0 });

	return (
		<>
			{(isFetching || isFetchingNextPage) && <Loading />}

			{error && error.response?.data && (
				<div>{error.response.data.message}</div>
			)}

			<Box
				sx={{
					position: "absolute",
					left: rightClickMenuAnchor.x,
					top: rightClickMenuAnchor.y
				}}
				ref={rightClickMenuBox}
			/>

			{data &&
				data.pages &&
				data.pages.map((messages) =>
					messages.map((message) => {
						const selected = selectedMessage?.id == message.id;

						return (
							<MessageListItem
								key={message.id}
								selectedMessage={selected}
								message={message}
								unSeen={
									selected
										? !selectedMessage?.flags.find((flag) => flag.match(/Seen/))
										: undefined
								}
								rightClickMenuBox={rightClickMenuBox}
								rightClickMenuOpen={
									rightClickMenuAnchor.id == message.id &&
									(rightClickMenuAnchor.x != 0 || rightClickMenuAnchor.y != 0)
								}
								setRightClickMenuAnchor={setRightClickMenuAnchor}
							/>
						);
					})
				)}

			{(isFetching || isFetchingNextPage) && (
				<Box
					sx={{
						width: "100%",
						display: "flex",
						justifyContent: "center",
						my: 3
					}}
				>
					<CircularProgress />
				</Box>
			)}

			{!selectedBox && (
				<Typography variant="h6" sx={{ textAlign: "center", mt: 1 }}>
					No mail box selected.
				</Typography>
			)}

			{data && data.pages && data.pages[0].length == 0 && (
				<Typography variant="h6" sx={{ textAlign: "center", mt: 1 }}>
					Mail box is empty
				</Typography>
			)}

			{/* Show a load more button, unless the last page doesn't have a full set of items */}
			{data && data.pages[data.pages.length - 1].length == messageCountForPage && (
				<Button fullWidth sx={{ mb: 1 }} onClick={() => fetchNextPage()}>
					Load More
				</Button>
			)}
		</>
	);
};

const MessageList = memo(UnMemoizedMessageList);

export default MessageList;

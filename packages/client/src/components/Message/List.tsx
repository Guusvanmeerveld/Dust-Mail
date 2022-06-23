import { useInfiniteQuery } from "react-query";

import { FunctionalComponent } from "preact";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import Message from "@interfaces/message";

import useFetch from "@utils/axiosClient";
import useStore from "@utils/createStore";

import Loading from "@components/Loading";
import MessageListItem from "@components/Message/ListItem";

const MessageList: FunctionalComponent = () => {
	const fetcher = useFetch();

	// The amount of messages to load per request
	const messageCountForPage = import.meta.env.VITE_MESSAGE_COUNT_PAGE ?? 20;

	const selectedBox = useStore((state) => state.selectedBox);

	const selectedMessage = useStore((state) => state.selectedMessage);

	// Request the messages using react-query
	const { data, error, fetchNextPage, isFetching, isFetchingNextPage } =
		useInfiniteQuery<Message[], Error>(
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

	return (
		<>
			{(isFetching || isFetchingNextPage) && <Loading />}
			{error && <div>{error.message}</div>}
			{data &&
				data.pages &&
				data.pages.map((messages) =>
					messages.map((message) => (
						<MessageListItem
							key={message.id}
							selectedMessage={selectedMessage == message.id}
							message={message}
						/>
					))
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

			{data && data.pages && data.pages[0].length == 0 && (
				<Typography>Mail box is empty</Typography>
			)}

			<Button sx={{ mx: "auto" }} onClick={() => fetchNextPage()}>
				Load More
			</Button>
		</>
	);
};

export default MessageList;

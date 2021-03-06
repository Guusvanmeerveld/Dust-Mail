import { useInfiniteQuery } from "react-query";

import { FunctionalComponent } from "preact";

import { memo } from "preact/compat";
import { useEffect, useRef, useState } from "preact/hooks";

import { AxiosError } from "axios";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import Error from "@interfaces/error";
import Message from "@interfaces/message";

import useFetch from "@utils/hooks/useFetch";
import useSelectedBox from "@utils/hooks/useSelectedBox";
import useSelectedMessage from "@utils/hooks/useSelectedMessage";
import useStore from "@utils/hooks/useStore";

import Loading from "@components/Loading";
import MessageListItem from "@components/Message/ListItem";
import useLocalStorageState from "use-local-storage-state";
import { LocalToken } from "@interfaces/responses";

const UnMemoizedMessageList: FunctionalComponent = () => {
	const fetcher = useFetch();

	const [accessToken] = useLocalStorageState<LocalToken>("accessToken");

	const setFetching = useStore((state) => state.setFetching);

	// The amount of messages to load per request
	const messageCountForPage = import.meta.env.VITE_MESSAGE_COUNT_PAGE ?? 20;

	const [selectedBox] = useSelectedBox();
	const [selectedMessage] = useSelectedMessage();

	// Request the messages using react-query
	const {
		data,
		error,
		fetchNextPage,
		isFetching,
		isFetchingNextPage,
		refetch
	} = useInfiniteQuery<Message[], AxiosError<{ code: Error; message: string }>>(
		["box", selectedBox?.id, accessToken?.body],
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
			enabled: selectedBox?.id != undefined
		}
	);

	useEffect(
		() => setFetching(isFetching || isFetchingNextPage),
		[isFetching, isFetchingNextPage]
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
						const selected = selectedMessage == message.id;

						return (
							<MessageListItem
								key={message.id}
								selectedMessage={selected}
								message={message}
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

			{!selectedBox?.id && (
				<Typography variant="h6" sx={{ textAlign: "center", mt: 1 }}>
					No mail box selected.
				</Typography>
			)}

			{error && error.response?.data && (
				<Box sx={{ textAlign: "center", mt: 1, mx: 1 }}>
					<Typography variant="h6">{error.response.data.message}</Typography>

					<Button onClick={() => refetch()}>Retry</Button>
				</Box>
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

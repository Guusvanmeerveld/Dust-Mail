import useLocalStorageState from "use-local-storage-state";

import { useEffect, useRef, useState, memo, FC, useMemo } from "react";
import { useInfiniteQuery } from "react-query";

import { AxiosError } from "axios";

import { IncomingMessage, ErrorResponse, LocalToken } from "@dust-mail/typings";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

import CloseIcon from "@mui/icons-material/Close";

import { messageCountForPage } from "@src/constants";

import useFetch from "@utils/hooks/useFetch";
import useMessageActions from "@utils/hooks/useMessageActions";
import useSelectedBox from "@utils/hooks/useSelectedBox";
import useSelectedMessage from "@utils/hooks/useSelectedMessage";
import useStore from "@utils/hooks/useStore";

import Loading from "@components/Loading";
import MessageListItem from "@components/Message/ListItem";

const UnMemoizedMessageList: FC = () => {
	const fetcher = useFetch();

	const setFetching = useStore((state) => state.setFetching);

	const [selectedBox] = useSelectedBox();
	const [selectedMessage] = useSelectedMessage();

	const [token] = useLocalStorageState<LocalToken>("accessToken");

	// Request the messages using react-query
	const {
		data,
		error,
		fetchNextPage,
		isFetching,
		isFetchingNextPage,
		refetch
	} = useInfiniteQuery<IncomingMessage[], AxiosError<ErrorResponse>>(
		["box", selectedBox?.id, token?.body],
		({ pageParam = 0 }) => {
			if (pageParam === false) {
				return [];
			}

			if (!selectedBox?.id) return [];

			return fetcher.getBox(selectedBox.id, pageParam);
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

	const messageActions = useMessageActions(rightClickMenuAnchor?.id);

	const rightClickMenuOpen = useMemo(
		() => rightClickMenuAnchor.x != 0 || rightClickMenuAnchor.y != 0,
		[rightClickMenuAnchor, selectedMessage]
	);

	const handleMenuClose = (): void => setRightClickMenuAnchor({ x: 0, y: 0 });

	return (
		<>
			{(isFetching || isFetchingNextPage) && <Loading />}

			{rightClickMenuOpen && rightClickMenuBox && (
				<Menu
					id="message-context-menu"
					open={rightClickMenuOpen}
					onClose={handleMenuClose}
					anchorEl={rightClickMenuBox?.current}
					MenuListProps={{
						"aria-labelledby": "message-context-menu-button"
					}}
				>
					{messageActions.map((action) => (
						<MenuItem
							key={action.name}
							onClick={() => {
								handleMenuClose();
								action.handler();
							}}
						>
							<ListItemIcon>{action.icon}</ListItemIcon>
							<ListItemText>{action.name}</ListItemText>
						</MenuItem>
					))}

					<MenuItem onClick={handleMenuClose}>
						<ListItemIcon>
							<CloseIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Close</ListItemText>
					</MenuItem>
				</Menu>
			)}

			<Box
				sx={{
					position: "absolute",
					width: "1px",
					height: "1px",
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

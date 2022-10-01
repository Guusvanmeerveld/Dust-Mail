import useLocalStorageState from "use-local-storage-state";

import {
	useEffect,
	useRef,
	useState,
	memo,
	FC,
	useMemo,
	FormEvent
} from "react";
import { useInfiniteQuery } from "react-query";

import { AxiosError } from "axios";

import { IncomingMessage, ErrorResponse, LocalToken } from "@dust-mail/typings";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";

import { messageCountForPage } from "@src/constants";

import useFetch from "@utils/hooks/useFetch";
import useMessageActions from "@utils/hooks/useMessageActions";
import useSelectedBox from "@utils/hooks/useSelectedBox";
import useSelectedMessage from "@utils/hooks/useSelectedMessage";
import useStore from "@utils/hooks/useStore";

import MessageListItem from "@components/Message/ListItem";

const ActionBar: FC<{
	setFilter: (filter: string) => void;
	refetch: () => void;
}> = ({ setFilter, refetch }) => {
	const theme = useTheme();

	const [search, setSearch] = useState<string>("");

	const handleSubmit = (e: FormEvent): void => {
		e.preventDefault();

		setFilter(search);
	};

	useEffect(() => {
		if (search.length == 0) setFilter("");
	}, [search]);

	const label = "Search messages";

	return (
		<>
			<Stack
				sx={{
					backgroundColor: theme.palette.background.default,
					borderBottom: `${theme.palette.divider} 1px solid`,
					width: 1,
					p: 2
				}}
				direction="row"
				alignItems="center"
				justifyContent="space-between"
			>
				<Box>
					<form onSubmit={handleSubmit}>
						<FormControl variant="outlined">
							<InputLabel size="small" htmlFor="search">
								{label}
							</InputLabel>
							<OutlinedInput
								endAdornment={
									<InputAdornment position="end">
										<Tooltip title="Clear">
											<IconButton
												sx={{
													visibility: search.length != 0 ? "visible" : "hidden"
												}}
												size="small"
												aria-label="clear input"
												onClick={() => {
													setSearch("");
												}}
												edge="end"
											>
												<CloseIcon />
											</IconButton>
										</Tooltip>
									</InputAdornment>
								}
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
								}}
								required
								size="small"
								id="search"
								label={label}
								type="text"
							/>
						</FormControl>

						<Tooltip title="Search">
							<IconButton onClick={() => setFilter(search)} sx={{ ml: 1 }}>
								<SearchIcon />
							</IconButton>
						</Tooltip>
					</form>
				</Box>

				<Tooltip title="Refresh messages">
					<IconButton onClick={() => refetch()}>
						<RefreshIcon />
					</IconButton>
				</Tooltip>
			</Stack>
		</>
	);
};

const UnMemoizedMessageList: FC = () => {
	const fetcher = useFetch();

	const setFetching = useStore((state) => state.setFetching);

	const [filter, setFilter] = useState("");

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
		["box", selectedBox?.id, filter, token?.body],
		({ pageParam = 0 }) => {
			if (pageParam === false) {
				return [];
			}

			if (!selectedBox?.id || !token?.body) return [];

			return fetcher.getBox(selectedBox.id, pageParam, filter);
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

			<ActionBar refetch={refetch} setFilter={setFilter} />

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
					Empty 🙃
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

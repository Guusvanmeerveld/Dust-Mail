import useLocalStorageState from "use-local-storage-state";

import { FC, useEffect, MouseEvent } from "react";
import { useQuery } from "react-query";
import { Navigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { LocalToken, LoginResponse } from "@interfaces/responses";

import scrollbarStyles from "@styles/scrollbar";

import useFetch from "@utils/hooks/useFetch";
import useLogin from "@utils/hooks/useLogin";
import useLogout from "@utils/hooks/useLogout";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";
import useUser from "@utils/hooks/useUser";
import useWindowWidth from "@utils/hooks/useWindowWidth";

import BoxesList from "@components/Boxes/List";
import Layout from "@components/Layout";
import MessageActionButton from "@components/Message/ActionButton";
import MessageList from "@components/Message/List";
import MessageOverview from "@components/Message/Overview";

const Dashboard: FC = () => {
	const theme = useTheme();

	const [accessToken] = useLocalStorageState<LocalToken>("accessToken");
	const [refreshToken] = useLocalStorageState<LocalToken>("refreshToken");

	const setFetching = useStore((state) => state.setFetching);

	const fetcher = useFetch();

	const logout = useLogout();
	const login = useLogin();

	const accessTokenExpired =
		accessToken && new Date(accessToken?.expires).getTime() < Date.now();

	if (
		accessTokenExpired &&
		refreshToken &&
		new Date(refreshToken?.expires).getTime() < Date.now()
	) {
		logout();
	}

	const {
		data: tokens,
		error: tokensError,
		isFetching: isFetchingTokens
	} = useQuery<LoginResponse>(
		"refreshTokens",
		() => fetcher.refresh(refreshToken?.body),
		{
			enabled: !!(accessTokenExpired && refreshToken)
		}
	);

	useEffect(() => {
		if (tokensError) setFetching(false);
		else setFetching(isFetchingTokens);
	}, [isFetchingTokens, tokensError]);

	useEffect(() => {
		if (tokens) login(tokens);
	}, [tokens]);

	const user = useUser();

	const [messageListWidth, setMessageListWidth] = useLocalStorageState<number>(
		"messageListWidth",
		{
			defaultValue: 400
		}
	);

	const [boxesListWidth, setBoxesListWidth] = useLocalStorageState<number>(
		"boxesListWidth",
		{
			defaultValue: 300
		}
	);

	const widthSetters = {
		boxes: setBoxesListWidth,
		messages: setMessageListWidth
	};

	const appBarHeight = theme.spacing(8);

	const fullpageHeight = `calc(100vh - ${appBarHeight})`;

	const windowWidth = useWindowWidth();

	const grabberWidth = 2;

	const handleDragStart = (
		originalWidth: number,
		dragEvent: MouseEvent,
		component: keyof typeof widthSetters
	): void => {
		const pageX = dragEvent.pageX;

		const run = (moveEvent: globalThis.MouseEvent): void => {
			moveEvent.preventDefault();

			const difference = pageX - moveEvent.pageX;

			const newWidth = originalWidth - difference;

			if (newWidth >= 200 && newWidth <= 600) widthSetters[component](newWidth);
		};

		const unsub = (): void => {
			document.removeEventListener("mousemove", run);
			document.removeEventListener("mouseup", unsub);
		};

		document.addEventListener("mousemove", run);
		document.addEventListener("mouseup", unsub);
	};

	const isMobile = theme.breakpoints.values.md >= windowWidth;

	return (
		<>
			{!user.isLoggedIn && <Navigate to="/" replace={true} />}
			<Layout withNavbar>
				<Stack direction="row" sx={{ height: fullpageHeight }}>
					{!isMobile && (
						<>
							<Box
								sx={{
									...scrollbarStyles(theme),
									width: boxesListWidth,
									overflowY: "scroll"
								}}
							>
								<BoxesList />
							</Box>

							<Box
								onMouseDown={(e: MouseEvent) =>
									handleDragStart(boxesListWidth, e, "boxes")
								}
								sx={{
									width: grabberWidth,
									bgcolor: theme.palette.divider,
									cursor: "col-resize"
								}}
							/>
						</>
					)}

					<Box
						sx={{
							...scrollbarStyles(theme),
							width: messageListWidth,
							overflowY: "scroll"
						}}
					>
						<MessageList />
					</Box>

					<Box
						onMouseDown={(e: MouseEvent) =>
							handleDragStart(messageListWidth, e, "messages")
						}
						sx={{
							width: grabberWidth,
							bgcolor: theme.palette.divider,
							cursor: "col-resize"
						}}
					/>

					<Stack
						direction="column"
						spacing={1}
						sx={{
							width:
								windowWidth -
								messageListWidth -
								(isMobile ? 0 : boxesListWidth) -
								grabberWidth * 2,
							transition: theme.transitions.create(["width", "transform"], {
								duration: theme.transitions.duration.standard
							}),
							px: 3,
							py: 1
						}}
					>
						<MessageOverview />
					</Stack>
				</Stack>

				<MessageActionButton />
			</Layout>
		</>
	);
};

export default Dashboard;

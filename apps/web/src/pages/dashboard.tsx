import useLocalStorageState from "use-local-storage-state";

import { FC, MouseEvent, useMemo } from "react";
import { Navigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import scrollbarStyles from "@styles/scrollbar";

import useTheme from "@utils/hooks/useTheme";
import useUser from "@utils/hooks/useUser";
import useWindowWidth from "@utils/hooks/useWindowWidth";

import DeleteBox from "@components/Boxes/Delete";
import BoxesList from "@components/Boxes/List";
import Layout from "@components/Layout";
import LoginStateHandler from "@components/LoginStateHandler";
import MessageActionButton from "@components/Message/ActionButton";
import MessageList from "@components/Message/List";
import MessageOverview from "@components/Message/Overview";
import Snackbar from "@components/Snackbar";

const defaultMessageListWidth = 400;

const Dashboard: FC = () => {
	const theme = useTheme();

	const scrollBarSx = useMemo(() => scrollbarStyles(theme), [theme]);

	const user = useUser();

	const [messageListWidth, setMessageListWidth] = useLocalStorageState<number>(
		"messageListWidth",
		{
			defaultValue: defaultMessageListWidth
		}
	);

	const [boxesListWidth, setBoxesListWidth] = useLocalStorageState<number>(
		"boxesListWidth",
		{
			defaultValue: 300
		}
	);

	const widthSetters = useMemo(
		() => ({
			boxes: setBoxesListWidth,
			messages: setMessageListWidth
		}),
		[setBoxesListWidth, setMessageListWidth]
	);

	const fullpageHeight = useMemo(
		() => `calc(100vh - ${theme.spacing(8)})`,
		[theme.spacing]
	);

	const windowWidth = useWindowWidth();

	const grabberWidth = 2;

	const handleDragStart = useMemo(
		() =>
			(
				originalWidth: number,
				dragEvent: MouseEvent,
				component: keyof typeof widthSetters
			): void => {
				const pageX = dragEvent.pageX;

				const run = (moveEvent: globalThis.MouseEvent): void => {
					moveEvent.preventDefault();

					const difference = pageX - moveEvent.pageX;

					const newWidth = originalWidth - difference;

					if (newWidth >= 200 && newWidth <= 600)
						widthSetters[component](newWidth);
				};

				const unsub = (): void => {
					document.removeEventListener("mousemove", run);
					document.removeEventListener("mouseup", unsub);
				};

				document.addEventListener("mousemove", run);
				document.addEventListener("mouseup", unsub);
			},
		[widthSetters]
	);

	const isMobile = theme.breakpoints.values.md >= windowWidth;

	return (
		<>
			{!user.isLoggedIn && <Navigate to="/" replace={true} />}
			<LoginStateHandler />
			<Snackbar />
			<Layout withNavbar>
				<Stack direction="row" sx={{ height: fullpageHeight }}>
					{!isMobile && (
						<>
							<Box
								sx={{
									...scrollBarSx,
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
									width: `${grabberWidth}px`,
									bgcolor: theme.palette.divider,
									cursor: "col-resize"
								}}
							/>
						</>
					)}

					<Box
						sx={{
							...scrollBarSx,
							width: isMobile ? 1 : messageListWidth,
							overflowY: "scroll"
						}}
					>
						<DeleteBox />
						<MessageList />
					</Box>

					{!isMobile && (
						<>
							<Box
								onMouseDown={(e: MouseEvent) =>
									handleDragStart(messageListWidth, e, "messages")
								}
								sx={{
									width: `${grabberWidth}px`,
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
						</>
					)}
				</Stack>

				<MessageActionButton />
			</Layout>
		</>
	);
};

export default Dashboard;

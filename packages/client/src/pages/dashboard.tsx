import useLocalStorageState from "use-local-storage-state";

import { Navigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import scrollbarStyles from "@styles/scrollbar";

import useTheme from "@utils/hooks/useTheme";
import useWindowWidth from "@utils/hooks/useWindowWidth";

import BoxesList from "@components/Boxes/List";
import Layout from "@components/Layout";
import MessageActionButton from "@components/Message/ActionButton";
import MessageList from "@components/Message/List";
import MessageOverview from "@components/Message/Overview";

const Dashboard = () => {
	const theme = useTheme();

	const [session] = useLocalStorageState("jwtToken");

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
	) => {
		const pageX = dragEvent.pageX;

		const run = (moveEvent: MouseEvent) => {
			moveEvent.preventDefault();

			const difference = pageX - moveEvent.pageX;

			const newWidth = originalWidth - difference;

			if (newWidth >= 200 && newWidth <= 600) widthSetters[component](newWidth);
		};

		const unsub = () => {
			document.removeEventListener("mousemove", run);
			document.removeEventListener("mouseup", unsub);
		};

		document.addEventListener("mousemove", run);
		document.addEventListener("mouseup", unsub);
	};

	const isMobile = theme.breakpoints.values.md >= windowWidth;

	return (
		<>
			{!session && <Navigate to="/" replace={true} />}
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

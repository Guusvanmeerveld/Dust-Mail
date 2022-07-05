import useLocalStorageState from "use-local-storage-state";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import useTheme from "@utils/hooks/useTheme";
import useWindowWidth from "@utils/hooks/useWindowWidth";

import Layout from "@components/Layout";
import MessageList from "@components/Message/List";
import MessageOverview from "@components/Message/Overview";

const Index = () => {
	const theme = useTheme();

	const [messageListWidth, setMesageListWidth] = useLocalStorageState<number>(
		"messageListWidth",
		{
			defaultValue: 400
		}
	);

	const appBarHeight = theme.spacing(8);

	const fullpageHeight = `calc(100vh - ${appBarHeight})`;

	const windowWidth = useWindowWidth();

	const grabberWidth = 2;

	const handleDragStart = (originalWidth: number, dragEvent: MouseEvent) => {
		const pageX = dragEvent.pageX;

		const run = (moveEvent: MouseEvent) => {
			moveEvent.preventDefault();

			const difference = pageX - moveEvent.pageX;

			const newWidth = originalWidth - difference;

			if (newWidth >= 200 && newWidth <= 600) setMesageListWidth(newWidth);
		};

		const unsub = () => {
			document.removeEventListener("mousemove", run);
			document.removeEventListener("mouseup", unsub);
		};

		document.addEventListener("mousemove", run);
		document.addEventListener("mouseup", unsub);
	};

	return (
		<Layout>
			<Stack direction="row" sx={{ height: fullpageHeight }}>
				<Box
					sx={{
						"&::-webkit-scrollbar": {
							width: theme.spacing(1)
						},
						"&::-webkit-scrollbar-track": {
							bgcolor: "transparent"
						},
						"&::-webkit-scrollbar-thumb": {
							backgroundImage:
								"linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))"
						},
						width: messageListWidth,
						overflowY: "scroll",
						px: 3
					}}
				>
					<MessageList />
				</Box>

				<Box
					onMouseDown={(e: MouseEvent) => handleDragStart(messageListWidth, e)}
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
						width: windowWidth - messageListWidth - grabberWidth,
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
		</Layout>
	);
};

export default Index;

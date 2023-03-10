import useLocalStorageState from "use-local-storage-state";

import { FC, useMemo } from "react";
import { Navigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import scrollbarStyles from "@styles/scrollbar";

import useSelectedMessage from "@utils/hooks/useSelectedMessage";
import useTheme from "@utils/hooks/useTheme";
import useUser from "@utils/hooks/useUser";
import useWindowWidth from "@utils/hooks/useWindowWidth";

import AddBox from "@components/Boxes/Add";
import DeleteBox from "@components/Boxes/Delete";
import BoxesList from "@components/Boxes/List";
import RenameBox from "@components/Boxes/Rename";
import Layout from "@components/Layout";
import MessageActionButton from "@components/Message/ActionButton";
import MessageList from "@components/Message/List";
import MessageOverview from "@components/Message/Overview";
import ParamStateHandler from "@components/ParamStateHandler";
import Settings from "@components/Settings";
import Slider from "@components/Slider";
import Snackbar from "@components/Snackbar";

const defaultMessageListWidth = 400;

const Dashboard: FC = () => {
	const theme = useTheme();

	const scrollBarSx = useMemo(() => scrollbarStyles(theme), [theme]);

	const user = useUser();

	const isLoggedIn = !!user;

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

	const fullpageHeight = useMemo(
		() => `calc(100vh - ${theme.spacing(8)})`,
		[theme.spacing]
	);

	const windowWidth = useWindowWidth();

	const grabberWidth = 2;

	const isMobile = theme.breakpoints.values.md >= windowWidth;

	const { selectedMessage } = useSelectedMessage();

	return (
		<>
			{!isLoggedIn && <Navigate to="/" replace={true} />}
			<ParamStateHandler />
			<Snackbar />
			<Settings />
			<Layout withNavbar>
				<Stack direction="row" sx={{ height: fullpageHeight }}>
					<AddBox />
					<DeleteBox />
					<RenameBox />
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
							<Slider
								currentWidth={boxesListWidth}
								widthSetter={setBoxesListWidth}
								grabberWidth={grabberWidth}
							/>
						</>
					)}
					<Box
						sx={{
							...scrollBarSx,
							width: isMobile ? 1 : messageListWidth,
							overflowY: "scroll",
							display: !isMobile || !selectedMessage ? "block" : "none"
						}}
					>
						<MessageList />
					</Box>

					<>
						{!isMobile && (
							<Slider
								currentWidth={messageListWidth}
								widthSetter={setMessageListWidth}
								grabberWidth={grabberWidth}
							/>
						)}

						<Stack
							direction="column"
							spacing={1}
							sx={{
								width:
									isMobile && selectedMessage
										? 1
										: windowWidth -
										  messageListWidth -
										  (isMobile ? 0 : boxesListWidth) -
										  grabberWidth * 2,
								transition: theme.transitions.create(["width", "transform"], {
									duration: theme.transitions.duration.standard
								}),
								display:
									!isMobile || (isMobile && selectedMessage) ? "flex" : "none",
								px: isMobile && selectedMessage ? 1 : 3,
								py: 1
							}}
						>
							<MessageOverview />
						</Stack>
					</>
				</Stack>

				<MessageActionButton />
			</Layout>
		</>
	);
};

export default Dashboard;

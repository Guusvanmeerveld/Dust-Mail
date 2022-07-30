import { FC, memo, KeyboardEvent, MouseEvent } from "react";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import MUIDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

import scrollbarStyles from "@styles/scrollbar";

import useTheme from "@utils/hooks/useTheme";
import useWindowWidth from "@utils/hooks/useWindowWidth";

import BoxesList from "@components/Boxes/List";

const UnMemoizedDrawer: FC<{
	toggleDrawer: (open: boolean) => (event: KeyboardEvent | MouseEvent) => void;
	drawerState: boolean;
}> = ({ toggleDrawer, drawerState }) => {
	const theme = useTheme();

	const windowWidth = useWindowWidth();

	const isMobile = theme.breakpoints.values.md >= windowWidth;

	if (!isMobile) return <></>;

	return (
		<MUIDrawer
			anchor="left"
			sx={{ ...scrollbarStyles(theme), p: 2 }}
			open={drawerState}
			onClose={toggleDrawer(false)}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "flex-end",
					padding: theme.spacing(0, 1),
					...theme.mixins.toolbar
				}}
			>
				<IconButton onClick={toggleDrawer(false)}>
					<ChevronLeftIcon />
				</IconButton>
			</Box>
			<Divider />
			<BoxesList switchBox={toggleDrawer(false)} />
		</MUIDrawer>
	);
};

const Drawer = memo(UnMemoizedDrawer);

export default Drawer;

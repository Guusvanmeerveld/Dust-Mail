import { FC, memo, useMemo, useState, MouseEvent, KeyboardEvent } from "react";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import MUIBreadCrumbs from "@mui/material/Breadcrumbs";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import MenuIcon from "@mui/icons-material/Menu";
import NavigateNext from "@mui/icons-material/NavigateNext";

import useSelectedBox from "@utils/hooks/useSelectedBox";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";
import useUser from "@utils/hooks/useUser";

import Avatar from "@components/Navbar/Avatar";
import Drawer from "@components/Navbar/Drawer";

const UnMemoizedBreadCrumbs: FC = () => {
	const theme = useTheme();

	const [selectedBox, setSelectedBox] = useSelectedBox();

	const secondaryColor = useMemo(
		() =>
			theme.palette.mode == "dark"
				? theme.palette.text.secondary
				: theme.palette.primary.contrastText,
		[theme.palette]
	);

	const primaryColor = useMemo(
		() =>
			theme.palette.mode == "dark"
				? theme.palette.text.primary
				: theme.palette.primary.contrastText,
		[theme.palette]
	);

	const { user } = useUser();

	const breadcrumbs = useMemo(() => {
		const boxIDSplit = selectedBox?.id.split(selectedBox.delimiter);

		return boxIDSplit?.map((crumb, i) => {
			const boxID = boxIDSplit.slice(0, i + 1).join(selectedBox?.delimiter);
			const boxName = user?.boxes.flattened?.find(
				(box) => box.id == boxID
			)?.name;

			const isSelectedBox = boxID == selectedBox?.id;

			return (
				<Typography
					sx={{
						color: isSelectedBox ? primaryColor : secondaryColor,
						cursor: isSelectedBox ? "inherit" : "pointer"
					}}
					key={boxID}
					onClick={() => {
						if (!isSelectedBox) setSelectedBox(boxID);
					}}
				>
					{boxName ?? "Unknown box"}
				</Typography>
			);
		});
	}, [selectedBox, primaryColor, secondaryColor]);

	return (
		<MUIBreadCrumbs
			sx={{
				display: breadcrumbs ? "flex" : "none",
				color: secondaryColor
			}}
			separator={<NavigateNext fontSize="small" />}
			aria-label="breadcrumb"
		>
			{breadcrumbs}
		</MUIBreadCrumbs>
	);
};

const BreadCrumbs = memo(UnMemoizedBreadCrumbs);

const FetchBar: FC = () => {
	const fetching = useStore((state) => state.fetching);

	return (
		<Box
			sx={{
				display: fetching ? "block" : "none",
				position: "absolute",
				bottom: 0,
				width: 1,
				height: 2
			}}
		>
			<LinearProgress color="secondary" />
		</Box>
	);
};

const UnMemoizedNavbar: FC = () => {
	const theme = useTheme();

	const [drawerState, setDrawerState] = useState(false);

	const toggleDrawer = useMemo(
		() => (open: boolean) => (event: KeyboardEvent | MouseEvent) => {
			if (
				event.type === "keydown" &&
				((event as KeyboardEvent).key === "Tab" ||
					(event as KeyboardEvent).key === "Shift")
			) {
				return;
			}

			setDrawerState(open);
		},
		[]
	);

	return (
		<>
			<AppBar position="relative">
				<>
					<Toolbar>
						<Stack
							direction="row"
							sx={{ flexGrow: 1, alignItems: "center" }}
							spacing={2}
						>
							<IconButton
								size="large"
								edge="start"
								color="inherit"
								aria-label="menu"
								sx={{
									display: { md: "none", sm: "inline-flex" }
								}}
								onClick={toggleDrawer(true)}
							>
								<MenuIcon />
							</IconButton>

							<Stack
								sx={{
									display: { md: "flex", xs: "none" }
								}}
								alignItems="center"
								direction="row"
								spacing={3}
							>
								<img
									src="/android-chrome-192x192.png"
									style={{ width: theme.spacing(5) }}
									alt="Logo"
								/>
								<Typography variant="h6">
									{import.meta.env.VITE_APP_NAME}
								</Typography>
							</Stack>

							<BreadCrumbs />
						</Stack>

						<Avatar />
					</Toolbar>
					<FetchBar />
				</>
			</AppBar>

			<Drawer drawerState={drawerState} toggleDrawer={toggleDrawer} />
		</>
	);
};

const Navbar = memo(UnMemoizedNavbar);

export default Navbar;

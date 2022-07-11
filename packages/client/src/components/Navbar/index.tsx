import { FunctionalComponent } from "preact";

import { useMemo, useState } from "preact/hooks";

import AppBar from "@mui/material/AppBar";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import MenuIcon from "@mui/icons-material/Menu";
import NavigateNext from "@mui/icons-material/NavigateNext";

import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

import Avatar from "@components/Navbar/Avatar";
import Drawer from "@components/Navbar/Drawer";

const Navbar: FunctionalComponent = () => {
	const theme = useTheme();

	const [drawerState, setDrawerState] = useState(false);

	const selectedBox = useStore((state) => state.selectedBox);
	const setSelectedBox = useStore((state) => state.setSelectedBox);

	const toggleDrawer =
		(open: boolean) => (event: KeyboardEvent | MouseEvent) => {
			if (
				event.type === "keydown" &&
				((event as KeyboardEvent).key === "Tab" ||
					(event as KeyboardEvent).key === "Shift")
			) {
				return;
			}

			setDrawerState(open);
		};

	const breadcrumbs = useMemo(() => {
		const boxNameSplit = selectedBox?.name.split(".");

		return boxNameSplit?.map((crumb, i) => {
			const boxName = boxNameSplit.slice(0, i + 1).join(".");

			return (
				<Typography
					sx={{ cursor: boxName == selectedBox?.name ? "inherit" : "pointer" }}
					key={boxName}
					onClick={() => {
						if (boxName == selectedBox?.name) return;

						const box = findBoxInPrimaryBoxesList(boxName);

						if (box) setSelectedBox({ ...box, id: box.name });
						else setSelectedBox({ id: boxName, name: boxName });
					}}
					color={
						i + 1 == boxNameSplit.length
							? theme.palette.text.primary
							: theme.palette.text.secondary
					}
				>
					{crumb}
				</Typography>
			);
		});
	}, [selectedBox?.name, theme.palette.text]);

	return (
		<>
			<AppBar position="static">
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

						<img
							src="/android-chrome-192x192.png"
							style={{ width: theme.spacing(5) }}
							alt="Logo"
						/>

						<Typography variant="h6">
							{import.meta.env.VITE_APP_NAME}
						</Typography>

						<Typography>
							{breadcrumbs && (
								<Breadcrumbs
									separator={<NavigateNext fontSize="small" />}
									aria-label="breadcrumb"
								>
									{breadcrumbs}
								</Breadcrumbs>
							)}
						</Typography>
					</Stack>

					<Avatar />
				</Toolbar>
			</AppBar>

			<Drawer drawerState={drawerState} toggleDrawer={toggleDrawer} />
		</>
	);
};

export default Navbar;

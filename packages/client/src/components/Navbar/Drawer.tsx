import { FunctionalComponent } from "preact";

import MUIDrawer from "@mui/material/Drawer";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

const Drawer: FunctionalComponent<{
	toggleDrawer: (open: boolean) => (event: KeyboardEvent | MouseEvent) => void;
	drawerState: boolean;
}> = ({ toggleDrawer, drawerState }) => {
	const drawerItems: { text: string; icon: JSX.Element }[] = [
		{ text: "Inbox", icon: <div></div> }
	];

	return (
		<MUIDrawer anchor="left" open={drawerState} onClose={toggleDrawer(false)}>
			{drawerItems.map((item) => (
				<ListItem key={item.text} disablePadding>
					<ListItemButton>
						<ListItemIcon>{item.icon}</ListItemIcon>
						<ListItemText primary={item.text} />
					</ListItemButton>
				</ListItem>
			))}
		</MUIDrawer>
	);
};

export default Drawer;

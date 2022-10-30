import { listen } from "@tauri-apps/api/event";

import {
	author,
	contributors,
	description,
	repository,
	homepage
} from "../../package.json";

import { FC } from "react";
import { useEffect } from "react";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import CodeIcon from "@mui/icons-material/Code";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import GlobeIcon from "@mui/icons-material/Public";

import modalStyles from "@styles/modal";

import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

const Contributor: FC<{
	name: string;
	url: string;
	email: string;
}> = ({ name, url, email }) => (
	<ListItem>
		<ListItemIcon>
			<PersonIcon />
		</ListItemIcon>
		<ListItemText primary={name} />
		<Stack direction="row" spacing={1}>
			<Tooltip title="Website">
				<IconButton target="_blank" href={url}>
					<GlobeIcon />
				</IconButton>
			</Tooltip>
			<Tooltip title="Email">
				<IconButton target="_blank" href={`mailto:${email}`}>
					<EmailIcon />
				</IconButton>
			</Tooltip>
		</Stack>
	</ListItem>
);

const About: FC = () => {
	const theme = useTheme();

	const isOpen = useStore((state) => state.showAbout);
	const setOpen = useStore((state) => state.setShowAbout);

	useEffect(() => {
		if ("__TAURI_METADATA__" in window) {
			const unlisten = listen("show_about", () => setOpen(true));

			return () => {
				unlisten.then((unlisten) => unlisten());
			};
		}
	}, []);

	return (
		<Modal open={isOpen} onClose={() => setOpen(false)}>
			<Box sx={modalStyles(theme)}>
				<Stack direction="row" spacing={1}>
					<Box sx={{ flex: 1 }}>
						<Typography variant="h4">
							About {import.meta.env.VITE_APP_NAME}
						</Typography>
					</Box>
					<Tooltip title="Repository">
						<IconButton target="_blank" href={repository.url}>
							<CodeIcon />
						</IconButton>
					</Tooltip>
					<Tooltip title="Website">
						<IconButton target="_blank" href={homepage}>
							<GlobeIcon />
						</IconButton>
					</Tooltip>
				</Stack>
				<Typography
					gutterBottom
					variant="h5"
					color={theme.palette.text.secondary}
				>
					{description}
				</Typography>

				<List subheader={<ListSubheader>List of contributors</ListSubheader>}>
					{[author, ...contributors].map((contributor) => (
						<Contributor key={contributor.name} {...contributor} />
					))}
				</List>
			</Box>
		</Modal>
	);
};

export default About;

import { FC, useState } from "react";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Modal from "@mui/material/Modal";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import modalStyles from "@styles/modal";

import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

type FolderType = "unified" | "normal" | "none";

const AddBox: FC = () => {
	const theme = useTheme();

	const setShowAddBox = useStore((state) => state.setShowAddBox);
	const showAddBox = useStore((state) => state.showAddBox);

	const [folderType, setFolderType] = useState<FolderType>("none");

	const [folderName, setFolderName] = useState<string>();

	const handleClose = (): void => setShowAddBox(false);

	return (
		<Modal open={showAddBox} onClose={handleClose}>
			<Stack spacing={2} direction="column" sx={modalStyles(theme)}>
				<Typography variant="h3">Add new folder</Typography>

				<FormControl fullWidth>
					<InputLabel id="folder-type-label">Folder type</InputLabel>
					<Select
						labelId="folder-type-label"
						id="folder-type"
						value={folderType}
						label="Folder type"
						onChange={(e) => setFolderType(e.target.value as FolderType)}
					>
						<MenuItem value="none">None</MenuItem>
						<MenuItem value="unified">
							Unified
							<Typography
								sx={{
									ml: 2,
									display: "inline",
									color: theme.palette.text.secondary
								}}
							>
								Create a (local) inbox that unifies together multiple inboxes
							</Typography>
						</MenuItem>
						<MenuItem value="normal">
							Normal{" "}
							<Typography
								sx={{
									ml: 2,
									display: "inline",
									color: theme.palette.text.secondary
								}}
							>
								Create a new inbox on the server
							</Typography>
						</MenuItem>
					</Select>
				</FormControl>

				{folderType != "none" && (
					<TextField
						fullWidth
						value={folderName}
						onChange={(e) => setFolderName(e.target.value)}
						label="Folder name"
					/>
				)}

				{folderType != "none" && <TextField fullWidth label="Parent folder" />}
			</Stack>
		</Modal>
	);
};

export default AddBox;

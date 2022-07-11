import useLocalStorageState from "use-local-storage-state";

import { FunctionalComponent } from "preact";

import { memo } from "preact/compat";
import { useEffect, useMemo } from "preact/hooks";

import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

import FolderIcon from "@mui/icons-material/Folder";

import MailBox from "@interfaces/box";

import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";
import useStore from "@utils/hooks/useStore";

const UnMemoizedBoxesList: FunctionalComponent<{
	switchBox?: (e: MouseEvent) => void;
}> = ({ switchBox: switchBoxCb }) => {
	const [boxes] = useLocalStorageState<string[]>("boxes");

	const [defaultBox] = useLocalStorageState("defaultBox", {
		defaultValue: "INBOX"
	});

	const selectedBox = useStore((state) => state.selectedBox);
	const setSelectedBox = useStore((state) => state.setSelectedBox);

	const setSelectedMessage = useStore((state) => state.setSelectedMessage);

	useEffect(() => {
		const box = findBoxInPrimaryBoxesList(defaultBox);

		if (box) setSelectedBox({ ...box, id: box.name });
		else setSelectedBox({ id: defaultBox, name: defaultBox });
	}, []);

	useEffect(() => {
		if (selectedBox) {
			document.title = `${import.meta.env.VITE_APP_NAME} - ${selectedBox.name}`;
			setSelectedMessage();
		}
	}, [selectedBox?.name]);

	// Find all of the primary boxes and sort them alphabetically
	const primaryBoxes: MailBox[] | undefined = useMemo(
		() =>
			boxes
				?.filter(findBoxInPrimaryBoxesList)
				.sort((a, b) => a.localeCompare(b))
				.map((i) => {
					const found = findBoxInPrimaryBoxesList(i);

					return { ...found!, id: i };
				}),
		[boxes]
	);

	// Find all of the other boxes and sort them alphabetically
	const otherBoxes: MailBox[] | undefined = useMemo(
		() =>
			boxes
				?.filter((i) => !findBoxInPrimaryBoxesList(i))
				.sort((a, b) => a.localeCompare(b))
				.map((i) => ({ name: i, id: i })),
		[boxes]
	);

	const switchBox = (e: MouseEvent, box: MailBox) => {
		setSelectedBox(box);

		if (switchBoxCb) switchBoxCb(e);
	};

	const createFolderTree = (boxes: MailBox[]) =>
		boxes.map((box) => (
			<ListItem selected={box.id == selectedBox?.id} disablePadding>
				<ListItemButton onClick={(e: MouseEvent) => switchBox(e, box)}>
					<ListItemIcon>{box.icon ?? <FolderIcon />}</ListItemIcon>
					<ListItemText>
						<Typography noWrap textOverflow="ellipsis">
							{box.name}
						</Typography>
					</ListItemText>
				</ListItemButton>
			</ListItem>
		));

	return (
		<>
			{primaryBoxes && createFolderTree(primaryBoxes)}
			{primaryBoxes && <Divider />}
			{otherBoxes && createFolderTree(otherBoxes)}
		</>
	);
};

const BoxesList = memo(UnMemoizedBoxesList);

export default BoxesList;

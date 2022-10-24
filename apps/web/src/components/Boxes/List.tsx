import useLocalStorageState from "use-local-storage-state";
import create from "zustand";

import { useEffect, useMemo, memo, FC, useState, MouseEvent } from "react";

// import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";

import AddIcon from "@mui/icons-material/Add";
import CheckBoxIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";

import MailBox from "@interfaces/box";

import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";
import useSelectedBox from "@utils/hooks/useSelectedBox";
import useStore from "@utils/hooks/useStore";

import AddBox from "@components/Boxes/Add";
import FolderTree, {
	FolderTreeProps,
	CheckedBoxesContext,
	CheckedBoxesStore
} from "@components/Boxes/FolderTree";

export const checkedBoxesStore = create<CheckedBoxesStore>((set) => ({
	checkedBoxes: {},
	setChecked: (id, checked) =>
		set((state) => ({ checkedBoxes: { ...state.checkedBoxes, [id]: checked } }))
}));

const UnMemoizedBoxesList: FC<{ clickOnBox?: (e: MouseEvent) => void }> = ({
	clickOnBox
}) => {
	const [boxes] = useLocalStorageState<MailBox[]>("boxes");

	const [selectedBox, setSelectedBox] = useSelectedBox();

	const showAddBox = useStore((state) => state.showAddBox);
	const setShowAddBox = useStore((state) => state.setShowAddBox);
	const setShowDeleteItemsDialog = useStore(
		(state) => state.setShowDeleteItemsDialog
	);

	const checkedBoxes = checkedBoxesStore((state) => state.checkedBoxes);

	const selectedBoxesArray = useMemo(
		() =>
			Object.entries(checkedBoxes)
				.filter(([, checked]) => checked)
				.map(([id]) => id),
		[checkedBoxes]
	);

	const [showSelector, setShowSelector] = useState(false);

	useEffect(() => {
		if (selectedBox) {
			const name = selectedBox.name ?? selectedBox.id;

			document.title = `${import.meta.env.VITE_APP_NAME}${
				name ? ` - ${name}` : ""
			}`;
		}
	}, [selectedBox]);

	const folderTreeProps = useMemo(
		(): FolderTreeProps => ({
			showCheckBox: showSelector,
			onClick: (box, e) => {
				setSelectedBox(box.id);
				if (clickOnBox) clickOnBox(e);
			}
		}),
		[showSelector]
	);

	// Find all of the primary boxes and sort them alphabetically
	const primaryBoxes: MailBox[] | undefined = useMemo(
		() =>
			boxes
				?.filter((box) => findBoxInPrimaryBoxesList(box.id))
				.sort((a, b) => a.id.localeCompare(b.id))
				.map((box) => {
					const found = findBoxInPrimaryBoxesList(box.id);

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					return { ...box, ...found! };
				}),
		[boxes]
	);

	// Find all of the other boxes and sort them alphabetically
	const otherBoxes: MailBox[] | undefined = useMemo(
		() =>
			boxes
				?.filter((box) => !findBoxInPrimaryBoxesList(box.id))
				.sort((a, b) => a.id.localeCompare(b.id)),
		[boxes]
	);

	return (
		<>
			{showAddBox && <AddBox />}
			<Stack
				sx={{ padding: 1 }}
				spacing={1}
				direction="row"
				alignItems="center"
				justifyContent="right"
			>
				{!showSelector && (
					<>
						<IconButton onClick={() => setShowSelector(true)}>
							<Tooltip title="Select folders">
								<CheckBoxIcon />
							</Tooltip>
						</IconButton>
						<IconButton onClick={() => setShowAddBox(true)}>
							<Tooltip title="Add new folder">
								<AddIcon />
							</Tooltip>
						</IconButton>
					</>
				)}
				{showSelector && (
					<>
						<IconButton
							onClick={() => {
								if (selectedBoxesArray.length > 0)
									setShowDeleteItemsDialog(true);
							}}
						>
							<Tooltip title="Delete selected items">
								<DeleteIcon />
							</Tooltip>
						</IconButton>
						<IconButton onClick={() => setShowSelector(false)}>
							<Tooltip title="Stop selecting folders">
								<CloseIcon />
							</Tooltip>
						</IconButton>
					</>
				)}
			</Stack>
			<CheckedBoxesContext.Provider value={checkedBoxesStore}>
				{(primaryBoxes || otherBoxes) && <Divider />}
				{primaryBoxes && (
					<FolderTree
						title="Primary folders"
						{...folderTreeProps}
						boxes={primaryBoxes}
					/>
				)}
				{primaryBoxes && <Divider />}
				{otherBoxes && (
					<FolderTree
						title="Other folders"
						{...folderTreeProps}
						boxes={otherBoxes}
					/>
				)}
			</CheckedBoxesContext.Provider>
		</>
	);
};

const BoxesList = memo(UnMemoizedBoxesList);

export default BoxesList;

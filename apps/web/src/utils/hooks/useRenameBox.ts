import Box from "@interfaces/box";

import useStore from "@utils/hooks/useStore";

import { renameBoxStore } from "@components/Boxes/Rename";

const useRenameBox = (): ((boxToRename: Box) => void) => {
	const setShowRenameBox = useStore((state) => state.setShowRenameBoxDialog);

	const setBoxToRename = renameBoxStore((state) => state.setBoxToRename);

	return (boxToRename: Box) => {
		setShowRenameBox(true);

		setBoxToRename(boxToRename);
	};
};

export default useRenameBox;

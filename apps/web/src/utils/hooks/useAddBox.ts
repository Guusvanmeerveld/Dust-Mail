import Box from "@interfaces/box";

import useStore from "@utils/hooks/useStore";

import { addBoxStore, FolderType } from "@components/Boxes/Add";

interface BoxOptions {
	folderName?: string;
	parentFolder?: Box;
	folderType?: FolderType;
}

const useAddBox = (): ((boxOptions: BoxOptions) => void) => {
	const setShowAddBox = useStore((state) => state.setShowAddBox);

	const setFolderType = addBoxStore((state) => state.setFolderType);
	const setParentFolder = addBoxStore((state) => state.setParentFolder);
	const setFolderName = addBoxStore((state) => state.setFolderName);

	return ({ folderName, parentFolder, folderType }: BoxOptions) => {
		setShowAddBox(true);

		if (folderType) setFolderType(folderType);
		if (parentFolder) setParentFolder(parentFolder);
		if (folderName) setFolderName(folderName);
	};
};

export default useAddBox;

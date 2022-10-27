import useStore from "@utils/hooks/useStore";

import { deleteBoxStore } from "@components/Boxes/Delete";

const useDeleteBox = (): ((boxesToDelete: string[]) => void) => {
	const setShowDeleteBox = useStore((state) => state.setShowDeleteItemsDialog);

	const setBoxesToDelete = deleteBoxStore((state) => state.setBoxesToDelete);

	return (boxesToDelete: string[]) => {
		setShowDeleteBox(true);

		setBoxesToDelete(boxesToDelete);
	};
};

export default useDeleteBox;

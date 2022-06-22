import create from "zustand";

import Box from "@interfaces/box";

const useStore = create<{
	selectedBox: Box | undefined;
	setselectedBox: (newBox: Box) => void;
	showSettings: boolean;
	setShowSettings: (show: boolean) => void;
	toggleShowSettings: () => void;
	selectedMessage: string | undefined;
	setSelectedMessage: (messageId?: string) => void;
}>((set) => ({
	selectedBox: undefined,
	setselectedBox: (newBox) => set({ selectedBox: newBox }),
	showSettings: false,
	setShowSettings: (show) => set({ showSettings: show }),
	toggleShowSettings: () =>
		set(({ showSettings }) => ({ showSettings: !showSettings })),
	selectedMessage: undefined,
	setSelectedMessage: (messageId) => set({ selectedMessage: messageId })
}));

export default useStore;

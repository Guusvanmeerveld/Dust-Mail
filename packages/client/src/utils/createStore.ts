import create from "zustand";

const useStore = create<{
	currentBox: string;
	setCurrentBox: (newBox: string) => void;
}>((set) => ({
	currentBox: "INBOX",
	setCurrentBox: (newBox: string) => set({ currentBox: newBox })
}));

export default useStore;

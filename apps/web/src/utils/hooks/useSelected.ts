import create from "zustand";

interface SelectedStore {
	selectedBox?: string;
	setSelectedBox: (id?: string) => void;
	selectedMessage?: string;
	setSelectedMessage: (id?: string) => void;
}

const useSelectedStore = create<SelectedStore>((set) => ({
	setSelectedBox: (id) =>
		set((state) => {
			return {
				selectedBox: id,
				selectedMessage:
					id == state.selectedBox ? state.selectedMessage : undefined
			};
		}),
	setSelectedMessage: (id) => set({ selectedMessage: id })
}));

export default useSelectedStore;

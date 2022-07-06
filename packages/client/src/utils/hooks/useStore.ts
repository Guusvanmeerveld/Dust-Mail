import create from "zustand";

import Box from "@interfaces/box";
import AdvancedLogin, { ServerType } from "@interfaces/login";

interface Store {
	selectedBox: Box | undefined;
	setSelectedBox: (newBox: Box) => void;
	showSettings: boolean;
	setShowSettings: (show: boolean) => void;
	toggleShowSettings: () => void;
	selectedMessage?: { id: string | undefined; flags: string[] };
	setSelectedMessage: (message?: { id: string; flags: string[] }) => void;
	advancedLoginSettings: Record<ServerType, AdvancedLogin>;
	setAdvancedLoginSettings: (type: ServerType, settings: AdvancedLogin) => void;
}

const useStore = create<Store>((set) => ({
	selectedBox: undefined,
	setSelectedBox: (newBox) => set({ selectedBox: newBox }),
	showSettings: false,
	setShowSettings: (show) => set({ showSettings: show }),
	toggleShowSettings: () =>
		set(({ showSettings }) => ({ showSettings: !showSettings })),
	selectedMessage: undefined,
	setSelectedMessage: (message) => set({ selectedMessage: message }),
	advancedLoginSettings: {
		incoming: {},
		outgoing: {}
	},
	setAdvancedLoginSettings: (type, settings) =>
		set(({ advancedLoginSettings }) => ({
			advancedLoginSettings: {
				...advancedLoginSettings,
				[type]: { ...advancedLoginSettings[type], ...settings }
			}
		}))
}));

export default useStore;

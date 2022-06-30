import create from "zustand";

import Box from "@interfaces/box";
import AdvancedLogin, { ServerType } from "@interfaces/login";

interface Store {
	selectedBox: Box | undefined;
	setselectedBox: (newBox: Box) => void;
	showSettings: boolean;
	setShowSettings: (show: boolean) => void;
	toggleShowSettings: () => void;
	selectedMessage: string | undefined;
	setSelectedMessage: (messageId?: string) => void;
	advancedLoginSettings: Record<ServerType, AdvancedLogin>;
	setAdvancedLoginSettings: (type: ServerType, settings: AdvancedLogin) => void;
}

const useStore = create<Store>((set) => ({
	selectedBox: undefined,
	setselectedBox: (newBox) => set({ selectedBox: newBox }),
	showSettings: false,
	setShowSettings: (show) => set({ showSettings: show }),
	toggleShowSettings: () =>
		set(({ showSettings }) => ({ showSettings: !showSettings })),
	selectedMessage: undefined,
	setSelectedMessage: (messageId) => set({ selectedMessage: messageId }),
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

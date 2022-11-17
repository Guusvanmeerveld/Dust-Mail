import create from "zustand";

import { version as appVersion } from "../../../package.json";

interface Store {
	fetching: boolean;
	setFetching: (fetching: boolean) => void;
	showAddBox: boolean;
	setShowAddBox: (show: boolean) => void;
	showAbout: boolean;
	setShowAbout: (show: boolean) => void;
	showDeleteItemsDialog: boolean;
	setShowDeleteItemsDialog: (show: boolean) => void;
	showRenameBoxDialog: boolean;
	setShowRenameBoxDialog: (showRenameBoxDialog: boolean) => void;
	showSettings: boolean;
	setShowSettings: (show: boolean) => void;
	toggleShowSettings: () => void;
	showChangelog: boolean;
	setShowChangelog: (show: boolean) => void;
	showMessageComposer: boolean;
	setShowMessageComposer: (open: boolean) => void;
	appVersion: { title: string; type: "git" | "stable" };
}

const createStore = create<Store>((set) => ({
	fetching: false,
	setFetching: (fetching: boolean) => set({ fetching }),
	showAbout: false,
	setShowAbout: (showAbout) =>
		set((state) => ({
			showAbout,
			showSettings: showAbout === true ? false : state.showSettings
		})),
	showDeleteItemsDialog: false,
	setShowDeleteItemsDialog: (showDeleteItemsDialog) =>
		set({ showDeleteItemsDialog }),
	showAddBox: false,
	setShowAddBox: (showAddBox) => set({ showAddBox }),
	showRenameBoxDialog: false,
	setShowRenameBoxDialog: (showRenameBoxDialog) => set({ showRenameBoxDialog }),
	showSettings: false,
	setShowSettings: (showSettings) => set({ showSettings }),
	toggleShowSettings: () =>
		set(({ showSettings }) => ({ showSettings: !showSettings })),
	showChangelog: false,
	setShowChangelog: (show) => set({ showChangelog: show }),
	showMessageComposer: false,
	setShowMessageComposer: (open) => set({ showMessageComposer: open }),
	appVersion: {
		title: appVersion,
		type: import.meta.env.VITE_UNSTABLE != undefined ? "git" : "stable"
	}
}));

export default createStore;

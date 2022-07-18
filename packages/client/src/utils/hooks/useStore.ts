import create from "zustand";

import { version as appVersion } from "../../../package.json";

interface Store {
	fetching: boolean;
	setFetching: (fetching: boolean) => void;
	showAbout: boolean;
	setShowAbout: (show: boolean) => void;
	showSettings: boolean;
	setShowSettings: (show: boolean) => void;
	toggleShowSettings: () => void;
	showMessageComposer: boolean;
	setShowMessageComposer: (open: boolean) => void;
	appVersion: { title: string; type: "git" | "stable" };
}

const createStore = create<Store>((set) => ({
	fetching: false,
	setFetching: (fetching: boolean) => set({ fetching }),
	showAbout: false,
	setShowAbout: (show) => set({ showAbout: show }),
	showSettings: false,
	setShowSettings: (show) => set({ showSettings: show }),
	toggleShowSettings: () =>
		set(({ showSettings }) => ({ showSettings: !showSettings })),
	showMessageComposer: false,
	setShowMessageComposer: (open) => set({ showMessageComposer: open }),
	appVersion: {
		title: appVersion,
		type: import.meta.env.VITE_UNSTABLE != undefined ? "git" : "stable"
	}
}));

export default createStore;

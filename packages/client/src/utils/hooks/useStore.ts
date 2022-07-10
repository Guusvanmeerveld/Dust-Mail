import create from "zustand";

import { version as appVersion } from "../../../package.json";

import Box from "@interfaces/box";

interface Store {
	fetching: boolean;
	setFetching: (fetching: boolean) => void;
	selectedBox: Box | undefined;
	setSelectedBox: (newBox: Box) => void;
	showSettings: boolean;
	setShowSettings: (show: boolean) => void;
	toggleShowSettings: () => void;
	selectedMessage?: { id: string | undefined; flags: string[] };
	setSelectedMessage: (message?: { id: string; flags: string[] }) => void;
	showMessageComposer: boolean;
	setShowMessageComposer: (open: boolean) => void;
	appVersion: { title: string; type: "git" | "stable" };
}

const createStore = create<Store>((set) => ({
	fetching: false,
	setFetching: (fetching: boolean) => set({ fetching }),
	selectedBox: undefined,
	setSelectedBox: (newBox) => set({ selectedBox: newBox }),
	showSettings: false,
	setShowSettings: (show) => set({ showSettings: show }),
	toggleShowSettings: () =>
		set(({ showSettings }) => ({ showSettings: !showSettings })),
	selectedMessage: undefined,
	setSelectedMessage: (message) => set({ selectedMessage: message }),
	showMessageComposer: false,
	setShowMessageComposer: (open) => set({ showMessageComposer: open }),
	appVersion: {
		title: appVersion,
		type: import.meta.env.VITE_UNSTABLE != undefined ? "git" : "stable"
	}
}));

export default createStore;

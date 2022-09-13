/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_NAME: string;
	readonly VITE_DEFAULT_SERVER: string;
	readonly VITE_MESSAGE_COUNT_PAGE?: string;
	readonly VITE_DEFAULT_BOX?: string;
	readonly VITE_UNSTABLE?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

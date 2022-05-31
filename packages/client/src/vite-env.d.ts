/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_NAME: string;
	readonly VITE_DEFAULT_SERVER: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

import useLocalStorageState from "use-local-storage-state";

import axios, { AxiosInstance } from "axios";

import { LocalToken } from "@interfaces/responses";

const useFetch = (): AxiosInstance => {
	const [backendServer] = useLocalStorageState<string>("customServerUrl", {
		defaultValue: import.meta.env.VITE_DEFAULT_SERVER
	});

	const [token] = useLocalStorageState<LocalToken>("accessToken");

	const instance = axios.create({
		baseURL: backendServer,
		headers: {
			Authorization: `Bearer ${token?.body}`
		}
	});

	return instance;
};

export default useFetch;

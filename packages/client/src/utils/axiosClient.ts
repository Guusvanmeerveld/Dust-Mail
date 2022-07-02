import useLocalStorageState from "use-local-storage-state";

import axios, { AxiosError } from "axios";

const useFetch = () => {
	const [customServerUrl] = useLocalStorageState<string>("customServerUrl", {
		defaultValue: import.meta.env.VITE_DEFAULT_SERVER
	});

	const [token, setToken] = useLocalStorageState<string>("jwtToken");

	const instance = axios.create({
		baseURL: customServerUrl,
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	instance.interceptors.response.use(
		(response) => response,
		(error: AxiosError) => {
			if (error.response?.status == 401) {
				setToken();
				return;
			}

			return Promise.reject(error);
		}
	);

	return instance;
};

export default useFetch;

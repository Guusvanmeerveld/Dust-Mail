import useLocalStorageState from "use-local-storage-state";

import axios from "axios";

const useFetch = () => {
	const [customServerUrl] = useLocalStorageState<string>("customServerUrl", {
		defaultValue: import.meta.env.VITE_DEFAULT_SERVER
	});

	const [token] = useLocalStorageState<string>("jwtToken");

	return axios.create({
		baseURL: customServerUrl,
		headers: { Authorization: `Bearer ${token}` }
	});
};

export default useFetch;

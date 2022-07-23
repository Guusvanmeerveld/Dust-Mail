import useLocalStorageState from "use-local-storage-state";

import { LocalToken } from "@interfaces/responses";
import useStore from "@utils/hooks/useStore";

const useLogout = (): (() => void) => {
	const [, setAccessToken] = useLocalStorageState<LocalToken>("accessToken");
	const [, setRefreshToken] = useLocalStorageState<LocalToken>("refreshToken");

	const setFetching = useStore((state) => state.setFetching);

	return () => {
		setFetching(false);

		setAccessToken();
		setRefreshToken();
	};
};

export default useLogout;

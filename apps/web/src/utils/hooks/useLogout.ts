import useLocalStorageState from "use-local-storage-state";

import { LocalToken } from "@dust-mail/typings";

import useStore from "@utils/hooks/useStore";

const useLogout = (): (() => void) => {
	const [, setAccessToken] = useLocalStorageState<LocalToken>("accessToken");
	const [, setRefreshToken] = useLocalStorageState<LocalToken>("refreshToken");

	const setFetching = useStore((state) => state.setFetching);

	return () => {
		setFetching(false);

		setAccessToken(undefined);
		setRefreshToken(undefined);
	};
};

export default useLogout;

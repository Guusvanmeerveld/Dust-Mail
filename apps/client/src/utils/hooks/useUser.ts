import useLocalStorageState from "use-local-storage-state";

import { LocalToken } from "@dust-mail/typings";

import User from "@interfaces/user";

const useUser = (): User => {
	const [username] = useLocalStorageState<string>("username");
	const [avatar] = useLocalStorageState<string>("avatar");
	const [loggedIn] = useLocalStorageState<LocalToken>("accessToken");

	const isLoggedIn = !!loggedIn;

	if (isLoggedIn) {
		return { isLoggedIn, avatar, username };
	} else {
		return { isLoggedIn };
	}
};

export default useUser;

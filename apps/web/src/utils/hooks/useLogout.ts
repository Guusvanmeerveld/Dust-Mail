import useSelectedStore from "./useSelected";
import { useCurrentUser, useRemoveUser, useUsers } from "./useUser";

import { useCallback } from "react";

import useStore from "@utils/hooks/useStore";

const useLogout = (): (() => void) => {
	const removeUser = useRemoveUser();

	const [users] = useUsers();

	const [currentUser, setCurrentUser] = useCurrentUser();

	const setSelectedBox = useSelectedStore((state) => state.setSelectedBox);

	const setFetching = useStore((state) => state.setFetching);

	const logout = useCallback((): void => {
		setFetching(false);

		if (!currentUser || !users) return;

		removeUser(currentUser?.username);

		const newCurrentUser = users
			.filter((user) => user.username != currentUser.username)
			?.shift();

		setCurrentUser(newCurrentUser?.username);

		if (newCurrentUser?.username) setSelectedBox();
	}, [users, currentUser, setFetching]);

	return logout;
};

export default useLogout;

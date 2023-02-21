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

		removeUser(currentUser?.id);

		const newCurrentUser = users
			.filter((user) => user.id != currentUser.id)
			?.shift();

		setCurrentUser(newCurrentUser?.id);

		if (newCurrentUser?.id) setSelectedBox();
	}, [users, currentUser, setFetching]);

	return logout;
};

export default useLogout;

import { useCurrentUser, useRemoveUser, useUsers } from "./useUser";

import { useMemo } from "react";

import useStore from "@utils/hooks/useStore";

const useLogout = (): (() => void) => {
	const removeUser = useRemoveUser();
	const [users] = useUsers();
	const [currentUser, setCurrentUser] = useCurrentUser();

	const setFetching = useStore((state) => state.setFetching);

	const logout = useMemo(
		() => (): void => {
			setFetching(false);

			if (!currentUser || !users) return;

			removeUser(currentUser?.username);

			const newCurrentUser = users?.shift();

			setCurrentUser(newCurrentUser?.username);
		},
		[users, currentUser, setFetching]
	);

	return logout;
};

export default useLogout;

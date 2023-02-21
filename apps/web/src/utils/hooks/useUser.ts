import useLocalStorageState from "use-local-storage-state";

import useSelectedStore from "./useSelected";

import { useCallback, useMemo } from "react";

import User from "@interfaces/user";

export const useUsers = (): [
	users: User[] | undefined,
	setUsers: (users: User[], oldUsers?: User[]) => void
] => {
	const [users, setUsers] = useLocalStorageState<User[]>("users", {
		defaultValue: []
	});

	const setNewUsers = useCallback(
		(newUsers: User[], oldUsers: User[] = []) =>
			setUsers([...oldUsers, ...newUsers]),
		[setUsers]
	);

	return [users, setNewUsers];
};

export const useCurrentUser = (): [
	currentUser: User | undefined,
	setCurrentUser: (id?: string) => void
] => {
	const [users] = useUsers();

	const [currentUserId, setUsername] =
		useLocalStorageState<string>("currentUser");

	const setSelectedBox = useSelectedStore((state) => state.setSelectedBox);

	const setUser = useCallback(
		(id?: string) => {
			setUsername(id);
			setSelectedBox();
		},
		[setSelectedBox]
	);

	const [currentUser, setCurrentUser] = useMemo(() => {
		const user = users?.find((user) => user.id == currentUserId);

		return [user, setUser];
	}, [currentUserId, users]);

	return [currentUser, setCurrentUser];
};

export const useAddUser = (): ((user: User) => void) => {
	const [users, setUsers] = useUsers();

	return (user) => {
		if (!users) return;

		setUsers([user], users);
	};
};

export const useRemoveUser = (): ((id: string) => void) => {
	const [users, setUsers] = useUsers();

	return useCallback(
		(id) => {
			if (!users) return;

			setUsers(
				[],
				users.filter((user) => user.id != id)
			);
		},
		[users, setUsers]
	);
};

export const useModifyUser = (): ((id: string, newUser: User) => void) => {
	const [users, setUsers] = useUsers();

	return (id, newUser) => {
		if (!users) return;

		setUsers(
			[newUser],
			users.filter((user) => user.id != id)
		);
	};
};

const useUser = (): User | undefined => {
	const [currentUser] = useCurrentUser();

	const user = useMemo(() => currentUser, [currentUser]);

	return user;
};

export default useUser;

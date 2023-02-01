import useLocalStorageState from "use-local-storage-state";

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
	setCurrentUser: (username?: string) => void
] => {
	const [users] = useUsers();

	const [currentUsername, setUsername] =
		useLocalStorageState<string>("currentUser");

	const [currentUser, setCurrentUser] = useMemo(() => {
		const user = users?.find((user) => user.username == currentUsername);

		return [user, setUsername];
	}, [currentUsername, users]);

	return [currentUser, setCurrentUser];
};

export const useAddUser = (): ((user: User) => void) => {
	const [users, setUsers] = useUsers();

	return (user) => {
		if (!users) return;

		setUsers([user], users);
	};
};

export const useRemoveUser = (): ((username: string) => void) => {
	const [users, setUsers] = useUsers();

	return useCallback(
		(username) => {
			if (!users) return;

			setUsers(
				[],
				users.filter((user) => user.username != username)
			);
		},
		[users, setUsers]
	);
};

export const useModifyUser = (): ((
	username: string,
	newUser: User
) => void) => {
	const [users, setUsers] = useUsers();

	return (username, newUser) => {
		if (!users) return;

		setUsers(
			[newUser],
			users.filter((user) => user.username != username)
		);
	};
};

const useUser = (): User | undefined => {
	const [currentUser] = useCurrentUser();

	const user = useMemo(() => currentUser, [currentUser]);

	return user;
};

export default useUser;

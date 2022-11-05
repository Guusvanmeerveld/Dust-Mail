import useLocalStorageState from "use-local-storage-state";

import { useMemo } from "react";

import Box from "@interfaces/box";
import User, { NewUser } from "@interfaces/user";

import nestBoxes from "@utils/nestBoxes";

export const useUsers = (): [
	users: User[] | undefined,
	setUsers: (users: NewUser[], oldUsers?: User[]) => void
] => {
	const [users, setUsers] = useLocalStorageState<User[]>("users", {
		defaultValue: []
	});

	const setNewUsers = useMemo(
		() =>
			(newUsers: NewUser[], oldUsers: User[] = []) =>
				setUsers([
					...oldUsers,
					...newUsers.map((user) => ({
						...user,
						boxes: {
							flattened: user.boxes,
							nested: nestBoxes(user.boxes)
						}
					}))
				]),
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

		if (!user) return [, setUsername];

		return [user, setUsername];
	}, [currentUsername, users]);

	return [currentUser, setCurrentUser];
};

export const useAddUser = (): ((user: NewUser) => void) => {
	const [users, setUsers] = useUsers();

	return (user) => {
		if (!users) return;

		setUsers([user], users);
	};
};

export const useRemoveUser = (): ((username: string) => void) => {
	const [users, setUsers] = useUsers();

	return useMemo(
		() => (username) => {
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
	newUser: NewUser
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

export const useAddBox = (): ((box: Box) => void) => {
	const [currentUser] = useCurrentUser();
	const modifyUser = useModifyUser();

	return (box) => {
		if (!currentUser) return;

		modifyUser(currentUser?.username, {
			...currentUser,
			boxes: [...currentUser.boxes.flattened, box]
		});
	};
};

export const useRemoveBox = (): ((ids: string[]) => void) => {
	const [currentUser] = useCurrentUser();
	const modifyUser = useModifyUser();

	return (ids) => {
		if (!currentUser) return;

		modifyUser(currentUser.username, {
			...currentUser,
			boxes: currentUser.boxes.flattened.filter((box) => !ids.includes(box.id))
		});
	};
};

export const useModifyBox = (): ((id: string, newBox: Box) => void) => {
	const [currentUser] = useCurrentUser();
	const modifyUser = useModifyUser();

	return (id, newBox) => {
		if (!currentUser) return;

		modifyUser(currentUser.username, {
			...currentUser,
			boxes: [
				...currentUser.boxes.flattened.filter((box) => box.id != id),
				newBox
			]
		});
	};
};

const useUser = (): { user?: User; isLoggedIn: boolean } => {
	const [currentUser] = useCurrentUser();

	const isLoggedIn = !!currentUser;

	if (isLoggedIn) {
		return { user: currentUser, isLoggedIn };
	} else {
		return { isLoggedIn };
	}
};

export default useUser;

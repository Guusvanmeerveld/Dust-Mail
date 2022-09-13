import useLocalStorageState from "use-local-storage-state";

import { useQuery } from "react-query";

// import { AxiosError } from "axios";
import useFetch from "@utils/hooks/useFetch";

/**
 * Time to refresh avatars in inbox in seconds
 */
const REFRESH_INBOX_AVATARS = 60 * 60;

export default function useAvatar(
	email?: string | undefined
): { data?: string; isLoading: boolean } | void {
	const fetcher = useFetch();

	const [noAvatar, setNoAvatar] = useLocalStorageState<number>(
		["noAvatar", email].join("-")
	);

	const blacklisted = !!noAvatar;

	const { data, isLoading, error } = useQuery<string>(
		["avatar", email],
		() => fetcher.getAvatar(email),
		// .catch((error: AxiosError) => {
		// 	if (error.response?.status == 404) {
		// 	}
		// }),
		{
			retry: false,
			enabled:
				(email != undefined && !blacklisted) ||
				!!(noAvatar && noAvatar < Date.now())
		}
	);

	if (email == undefined) return;

	if (error && !data && !isLoading && (!noAvatar || noAvatar < Date.now())) {
		setNoAvatar(Date.now() + REFRESH_INBOX_AVATARS * 1000);
	}

	return { data, isLoading };
}

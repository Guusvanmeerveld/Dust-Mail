import { useQuery } from "react-query";

// import { AxiosError } from "axios";
import useFetch from "@utils/hooks/useFetch";
import useLocalStorageState from "use-local-storage-state";

/**
 * Time to refresh avatars in inbox in seconds
 */
const REFRESH_INBOX_AVATARS = 60 * 60;

function useAvatar(email: null): void;
function useAvatar(email: string): {
	data?: string;
	isLoading: boolean;
};
function useAvatar(
	email: string | null
): { data?: string; isLoading: boolean } | void;
function useAvatar(
	email: string | null
): { data?: string; isLoading: boolean } | void {
	const fetcher = useFetch();

	const [noAvatar, setNoAvatar] = useLocalStorageState<number>(
		["noAvatar", email].join("-")
	);

	const blacklisted = !!noAvatar;

	const { data, isLoading, error } = useQuery<string>(
		["avatar", email],
		() =>
			fetcher("/avatar", {
				params: { address: email }
			}).then((res) => res.data),
		// .catch((error: AxiosError) => {
		// 	if (error.response?.status == 404) {
		// 	}
		// }),
		{
			retry: false,
			enabled:
				(email !== null && !blacklisted) ||
				!!(noAvatar && noAvatar < Date.now())
		}
	);

	if (email === null) return;

	if (error && !data && !isLoading && (!noAvatar || noAvatar < Date.now())) {
		setNoAvatar(Date.now() + REFRESH_INBOX_AVATARS * 1000);
	}

	return { data, isLoading };
}

export default useAvatar;

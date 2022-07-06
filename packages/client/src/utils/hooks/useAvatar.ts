import { useQuery } from "react-query";

import { AxiosError } from "axios";

import useFetch from "@utils/hooks/useFetch";

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

	const { data, isLoading } = useQuery<string>(
		["avatar", email],
		() =>
			fetcher("/avatar", {
				params: { address: email }
			})
				.then((res) => res.data)
				.catch((error: AxiosError) => {
					if (error.response?.status == 404) {
					}
				}),
		{ retry: false, enabled: email !== null }
	);

	if (email === null) return;

	return { data, isLoading };
}

export default useAvatar;

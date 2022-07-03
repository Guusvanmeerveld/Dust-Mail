import { useQuery } from "react-query";

import { AxiosError } from "axios";

import useFetch from "@utils/axiosClient";

const useAvatar = (email: string): { data?: string; isLoading: boolean } => {
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
		{ retry: false }
	);

	return { data, isLoading };
};

export default useAvatar;

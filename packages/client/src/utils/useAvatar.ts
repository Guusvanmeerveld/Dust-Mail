import { useQuery } from "react-query";

import { AxiosError } from "axios";

import useFetch from "@utils/axiosClient";

const useAvatar = (email: string) => {
	const fetcher = useFetch();

	const { data } = useQuery<string>(
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

	return data;
};

export default useAvatar;

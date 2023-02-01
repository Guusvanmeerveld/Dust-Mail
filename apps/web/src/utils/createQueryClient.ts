import { QueryClient } from "react-query";

import { AxiosError } from "axios";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: (failureCount, error) => {
				if (failureCount < 4 && (error as AxiosError).code == "ERR_NETWORK")
					return true;
				else return false;
			}
		}
	}
});

export default queryClient;

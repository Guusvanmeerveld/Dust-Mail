import { QueryClient } from "react-query";

const queryClient = new QueryClient({
	defaultOptions: { queries: { refetchOnWindowFocus: true } }
});

export default queryClient;

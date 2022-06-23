import { QueryClient } from "react-query";

const queryClient = new QueryClient({
	defaultOptions: { queries: { refetchOnWindowFocus: import.meta.env.DEV } }
});

export default queryClient;

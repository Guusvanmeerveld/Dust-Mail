import Index from "./Index";
import Login from "./Login";
import { QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import useLocalStorageState from "use-local-storage-state";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import queryClient from "@utils/createClient";
import useTheme from "@utils/hooks/useTheme";

const App = () => {
	const theme = useTheme();

	const [isLoggedIn] = useLocalStorageState<string | undefined>("jwtToken");

	return (
		<ThemeProvider theme={theme}>
			<QueryClientProvider client={queryClient}>
				<ReactQueryDevtools initialIsOpen={false} />
				<CssBaseline />
				{isLoggedIn && <Index />}
				{!isLoggedIn && <Login />}
			</QueryClientProvider>
		</ThemeProvider>
	);
};

export default App;

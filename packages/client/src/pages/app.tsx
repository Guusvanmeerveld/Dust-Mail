import Index from "./Index";
import Login from "./Login";
import useLocalStorageState from "use-local-storage-state";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import useTheme from "@utils/hooks/useTheme";

const App = () => {
	const theme = useTheme();

	const [isLoggedIn] = useLocalStorageState("isLoggedIn", {
		defaultValue: false
	});

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			{isLoggedIn && <Index />}
			{!isLoggedIn && <Login />}
		</ThemeProvider>
	);
};

export default App;

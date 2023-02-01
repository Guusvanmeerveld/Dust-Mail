import NotFound from "./404";
import AddAccount from "./addAccount";
import Dashboard from "./dashboard";
import Login from "./login";

import { FC } from "react";
import { QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import queryClient from "@utils/createQueryClient";
import useTheme from "@utils/hooks/useTheme";

const App: FC = () => {
	const theme = useTheme();

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<QueryClientProvider client={queryClient}>
				<ReactQueryDevtools initialIsOpen={false} />
				<BrowserRouter>
					<Routes>
						<Route path="/" element={<Login />} />
						<Route path="add-account" element={<AddAccount />} />
						<Route path="dashboard" element={<Dashboard />}>
							<Route path="compose" element={<Dashboard />} />
							<Route path=":boxID" element={<Dashboard />}>
								<Route path=":messageID" element={<Dashboard />} />
							</Route>
						</Route>
						<Route path="*" element={<NotFound />} />
					</Routes>
				</BrowserRouter>
			</QueryClientProvider>
		</ThemeProvider>
	);
};

export default App;

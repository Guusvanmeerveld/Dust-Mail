import useLocalStorageState from "use-local-storage-state";

import { useMemo } from "react";

import { blue, orange } from "@mui/material/colors";
import createTheme, { Theme } from "@mui/material/styles/createTheme";
import useMediaQuery from "@mui/material/useMediaQuery";

const useTheme = (): Theme => {
	let darkMode = true;

	darkMode = useMediaQuery("(prefers-color-scheme: dark)");

	const [hasDarkModeInSettings] = useLocalStorageState<boolean>("darkMode");

	if (hasDarkModeInSettings !== undefined) darkMode = hasDarkModeInSettings;

	const theme = useMemo(
		() =>
			createTheme({
				palette: {
					mode: darkMode ? "dark" : "light",
					primary: {
						main: blue[500]
					},
					secondary: {
						main: orange[500]
					}
				}
			}),
		[hasDarkModeInSettings]
	);

	return theme;
};

export default useTheme;

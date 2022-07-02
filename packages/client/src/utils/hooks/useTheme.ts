import useLocalStorageState from "use-local-storage-state";

import { blue, orange } from "@mui/material/colors";
import createTheme from "@mui/material/styles/createTheme";
import useMediaQuery from "@mui/material/useMediaQuery";

const useTheme = () => {
	let darkMode = true;

	darkMode = useMediaQuery("(prefers-color-scheme: dark)");

	const [hasDarkModeInSettings] = useLocalStorageState<boolean>("darkMode");

	if (hasDarkModeInSettings !== undefined) darkMode = hasDarkModeInSettings;

	return createTheme({
		palette: {
			mode: darkMode ? "dark" : "light",
			primary: {
				main: blue[500]
			},
			secondary: {
				main: orange[500]
			}
		}
	});
};

export default useTheme;

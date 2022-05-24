import { blue, orange } from "@mui/material/colors";
import createTheme from "@mui/material/styles/createTheme";
import useMediaQuery from "@mui/material/useMediaQuery";

const useTheme = () => {
	const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

	return createTheme({
		palette: {
			mode: prefersDarkMode ? "dark" : "light",
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

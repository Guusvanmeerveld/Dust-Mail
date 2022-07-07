import useLocalStorageState from "use-local-storage-state";

import { ChangeEvent } from "preact/compat";

import Switch from "@mui/material/Switch";

const DarkModeSwitch = () => {
	const [darkMode, setDarkMode] = useLocalStorageState<boolean>("darkMode");

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setDarkMode(e.currentTarget.checked);
	};

	return (
		<Switch
			checked={darkMode ?? false}
			onChange={handleChange}
			color="primary"
		/>
	);
};

export default DarkModeSwitch;

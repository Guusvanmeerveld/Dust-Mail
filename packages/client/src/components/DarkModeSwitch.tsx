import useLocalStorageState from "use-local-storage-state";

import { FunctionalComponent } from "preact";

import { ChangeEvent } from "preact/compat";

import Switch from "@mui/material/Switch";

const DarkModeSwitch: FunctionalComponent = () => {
	const [darkMode, setDarkMode] = useLocalStorageState<boolean>("darkMode");

	const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
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

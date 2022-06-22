import { FunctionComponent } from "preact";

import useStore from "@utils/createStore";

import Navbar from "@components/Navbar";
import Settings from "@components/Settings";

const Layout: FunctionComponent = ({ children }) => {
	const showSettings = useStore((state) => state.showSettings);

	return (
		<>
			<Navbar />
			{showSettings && <Settings />}
			{children}
		</>
	);
};

export default Layout;

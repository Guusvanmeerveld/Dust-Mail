import Loading from "./Loading";

import { FunctionComponent } from "preact";

import Navbar from "@components/Navbar";
import Settings from "@components/Settings";

const Layout: FunctionComponent<{ withNavbar?: boolean }> = ({
	children,
	withNavbar
}) => {
	return (
		<>
			<Loading />
			{withNavbar && <Navbar />}
			<Settings />
			{children}
		</>
	);
};

export default Layout;

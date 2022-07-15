import Loading from "./Loading";

import { FunctionComponent } from "preact";

import MessageComposer from "@components/Message/Composer";
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
			<MessageComposer />
			{children}
		</>
	);
};

export default Layout;

import { FC, ReactNode } from "react";

import About from "@components/About";
import MessageComposer from "@components/Message/Composer";
import Navbar from "@components/Navbar";
import Settings from "@components/Settings";

const Layout: FC<{ withNavbar?: boolean; children?: ReactNode }> = ({
	children,
	withNavbar
}) => {
	return (
		<>
			<About />
			{withNavbar && <Navbar />}
			<Settings />
			<MessageComposer />
			{children}
		</>
	);
};

export default Layout;

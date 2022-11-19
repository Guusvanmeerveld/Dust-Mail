import { FC, ReactNode } from "react";

import About from "@components/About";
import Changelog from "@components/Changelog";
import MessageComposer from "@components/Message/Composer";
import Navbar from "@components/Navbar";

const Layout: FC<{ withNavbar?: boolean; children?: ReactNode }> = ({
	children,
	withNavbar
}) => {
	return (
		<>
			<About />
			<Changelog />
			{withNavbar && <Navbar />}
			<MessageComposer />
			{children}
		</>
	);
};

export default Layout;

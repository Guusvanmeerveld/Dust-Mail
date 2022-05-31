import { FunctionComponent } from "preact";

import Navbar from "@components/Navbar";

const Layout: FunctionComponent = ({ children }) => (
	<>
		<Navbar />
		{children}
	</>
);

export default Layout;

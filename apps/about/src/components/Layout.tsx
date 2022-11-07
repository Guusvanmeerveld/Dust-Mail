import { NextSeo } from "next-seo";

import { FC } from "react";

const Layout: FC<{ title?: string }> = ({ title, children }) => (
	<>
		<NextSeo title={title} />
		<div className="root">{children}</div>
	</>
);

export default Layout;

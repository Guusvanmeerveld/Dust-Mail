import { NextPage } from "next";
import { NextSeo } from "next-seo";

import Header from "@components/Header";

const Index: NextPage = () => (
	<>
		<NextSeo title="Home" />
		<div className="root">
			<Header />
			<main>lorem ipsum</main>
		</div>
	</>
);

export default Index;

import { NextPage } from "next";

import Footer from "@components/Footer";
import Header from "@components/Header";
import Layout from "@components/Layout";

const Index: NextPage = () => (
	<Layout title="Home">
		<Header />
		<main>lorem ipsum</main>
		<Footer />
	</Layout>
);

export default Index;

import { NextPage } from "next";
import { NextSeo } from "next-seo";

const NotFound: NextPage = () => (
	<>
		<NextSeo title="Not found" />
		<div className="root">
			<main>
				<h2>Page not found</h2>
				<p>Maybe the page has moved or never existed.</p>
				<a href="/">Go home</a>
			</main>
		</div>
	</>
);

export default NotFound;

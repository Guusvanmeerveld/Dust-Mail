import { DefaultSeo } from "next-seo";
import type { AppProps } from "next/app";

import SEO from "../next-seo.config";

import "@styles/globals.scss";

const App = ({ Component, pageProps }: AppProps): JSX.Element => (
	<>
		<DefaultSeo {...SEO} />
		<Component {...pageProps} />
	</>
);

export default App;

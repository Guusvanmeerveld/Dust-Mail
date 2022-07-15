import App from "./pages/app";

import { render } from "preact";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

if ("navigator" in window && "registerProtocolHandler" in navigator)
	navigator.registerProtocolHandler("mailto", "/dashboard/compose?uri=%s");

render(<App />, document.getElementById("app")!);

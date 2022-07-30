import App from "./pages/app";

import React from "react";
import ReactDOM from "react-dom/client";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

if ("navigator" in window && "registerProtocolHandler" in navigator)
	navigator.registerProtocolHandler("mailto", "/dashboard/compose?uri=%s");

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);

import { render } from "preact";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import App from "./pages/app";

// import { invoke } from "@tauri-apps/api/tauri";

// document.addEventListener("DOMContentLoaded", () =>
//   invoke("close_splashscreen")
// );

// invoke("connect", {
//   server: "imap.guusvanmeerveld.dev",
//   port: 465,
// }).then(console.log);

render(<App />, document.getElementById("app")!);

import "preact/debug";
import { render } from "preact";

import { App } from "./pages/app";

render(<App />, document.getElementById("app")!);

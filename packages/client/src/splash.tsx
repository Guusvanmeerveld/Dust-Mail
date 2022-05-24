import { render } from "preact";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const App = () => {
  return <div>splashy</div>;
};

render(<App />, document.getElementById("app")!);

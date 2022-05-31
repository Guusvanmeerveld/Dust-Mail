import { FunctionComponent } from "preact";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";

const Loading: FunctionComponent = () => (
	<Box sx={{ width: "100%", top: "0", position: "absolute" }}>
		<LinearProgress />
	</Box>
);

export default Loading;

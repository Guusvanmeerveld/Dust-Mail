import { FunctionalComponent } from "preact";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";

import useStore from "@utils/hooks/useStore";

const Loading: FunctionalComponent = () => {
	const fetching = useStore((state) => state.fetching);

	if (fetching)
		return (
			<Box sx={{ width: "100%", top: "0", position: "fixed" }}>
				<LinearProgress color="secondary" />
			</Box>
		);
	else return <></>;
};

export default Loading;

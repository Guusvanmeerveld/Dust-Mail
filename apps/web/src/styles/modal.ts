import { Theme } from "@mui/material/styles";

import { defineStyles } from "@src/styles";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const modalStyles = (theme: Theme) =>
	defineStyles({
		position: "absolute",
		top: "50%",
		left: "50%",
		width: { lg: "40vw", xs: "80vw" },
		transform: "translate(-50%, -50%)",
		bgcolor: theme.palette.background.paper,
		outline: 0,
		boxShadow: 24,
		p: 4
	});

export default modalStyles;

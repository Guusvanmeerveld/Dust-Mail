import { Theme } from "@mui/material/styles";

import { defineStyles } from "@src/styles";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const scrollbarStyles = (theme: Theme) =>
	defineStyles({
		"&::-webkit-scrollbar": {
			width: theme.spacing(1)
		},
		"&::-webkit-scrollbar-track": {
			bgcolor: "transparent"
		},
		"&::-webkit-scrollbar-thumb": {
			backgroundColor: theme.palette.action.hover
		}
	});

export default scrollbarStyles;

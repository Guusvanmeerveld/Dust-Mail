import { SxProps, Theme } from "@mui/material/styles";

const scrollbarStyles = (theme: Theme): SxProps => ({
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

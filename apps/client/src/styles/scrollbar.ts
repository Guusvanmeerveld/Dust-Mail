import { SxProps, Theme } from "@mui/material/styles";

const scrollbarStyles = (theme: Theme): SxProps => ({
	"&::-webkit-scrollbar": {
		width: theme.spacing(1)
	},
	"&::-webkit-scrollbar-track": {
		bgcolor: "transparent"
	},
	"&::-webkit-scrollbar-thumb": {
		backgroundImage:
			"linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))"
	}
});

export default scrollbarStyles;

import { SxProps, Theme } from "@mui/material/styles";

const modalStyles = (theme: Theme): SxProps => ({
	position: "absolute",
	top: "50%",
	left: "50%",
	minWidth: "20rem",
	width: "40vw",
	transform: "translate(-50%, -50%)",
	bgcolor: theme.palette.background.paper,
	outline: 0,
	boxShadow: 24,
	p: 4
});

export default modalStyles;

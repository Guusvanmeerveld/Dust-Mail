import { FC, memo, MouseEvent } from "react";

import Box from "@mui/material/Box";

// import DragIcon from "@mui/icons-material/DragHandle";
import useTheme from "@utils/hooks/useTheme";

const UnMemoizedSlider: FC<{
	widthSetter: (width: number) => void;
	grabberWidth: number;
	currentWidth: number;
}> = ({ widthSetter, currentWidth, grabberWidth }) => {
	const theme = useTheme();

	const handleDragStart = (
		originalWidth: number,
		dragEvent: MouseEvent
	): void => {
		const pageX = dragEvent.pageX;

		const run = (moveEvent: globalThis.MouseEvent): void => {
			moveEvent.preventDefault();

			const difference = pageX - moveEvent.pageX;

			const newWidth = originalWidth - difference;

			if (newWidth >= 200 && newWidth <= 600) widthSetter(newWidth);
		};

		const unsub = (): void => {
			document.removeEventListener("mousemove", run);
			document.removeEventListener("mouseup", unsub);
		};

		document.addEventListener("mousemove", run);
		document.addEventListener("mouseup", unsub);
	};

	return (
		<Box
			onMouseDown={(e: MouseEvent) => handleDragStart(currentWidth, e)}
			sx={{
				width: `${grabberWidth}px`,
				bgcolor: theme.palette.divider,
				cursor: "col-resize",
				display: "flex",
				justifyContent: "center",
				alignItems: "center"
			}}
		>
			{/* <DragIcon sx={{ rotate: "90deg", color: theme.palette.text.secondary }} /> */}
		</Box>
	);
};

const Slider = memo(UnMemoizedSlider);

export default Slider;

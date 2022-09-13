import { FC } from "react";
import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import Layout from "@components/Layout";

const NotFound: FC = () => {
	const navigate = useNavigate();

	const goBack = (): void => {
		navigate(-1);
	};

	return (
		<Layout>
			<Box
				sx={{
					p: 2,
					height: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center"
				}}
			>
				<Box>
					<Typography gutterBottom variant="h3" textAlign="center">
						Page not found
					</Typography>
					<Button
						sx={{ width: "10rem", mx: "auto", display: "block" }}
						onClick={() => goBack()}
						variant="text"
					>
						Go back
					</Button>
				</Box>
			</Box>
		</Layout>
	);
};

export default NotFound;

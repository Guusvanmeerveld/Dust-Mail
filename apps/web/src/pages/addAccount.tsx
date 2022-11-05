import { FC } from "react";
import { useNavigate } from "react-router";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import Layout from "@components/Layout";
import LoginForm from "@components/Login/Form";

const AddAccount: FC = () => {
	const navigate = useNavigate();

	const goBack = (): void => {
		navigate(-1);
	};

	return (
		<Layout>
			<Box
				sx={{
					display: "flex",
					width: 1,
					height: "100vh",
					alignItems: "center",
					justifyContent: "center"
				}}
			>
				<LoginForm trailing={<Button onClick={() => goBack()}>Go back</Button>}>
					<Typography variant="h2">Add account</Typography>
				</LoginForm>
			</Box>
		</Layout>
	);
};

export default AddAccount;

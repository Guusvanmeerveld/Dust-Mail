import { FC } from "react";
import { useNavigate } from "react-router";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

import useStore from "@utils/hooks/useStore";

import Layout from "@components/Layout";
import LoginForm from "@components/Login/Form";

const FetchBar: FC = () => {
	const fetching = useStore((state) => state.fetching);

	return (
		<Box
			sx={{
				display: fetching ? "block" : "none",
				position: "absolute",
				top: 0,
				width: 1,
				height: 2
			}}
		>
			<LinearProgress color="secondary" />
		</Box>
	);
};

const AddAccount: FC = () => {
	const navigate = useNavigate();

	const goBack = (): void => {
		navigate(-1);
	};

	return (
		<Layout>
			<FetchBar />
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

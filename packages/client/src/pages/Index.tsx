import Grid from "@mui/material/Grid";

import useTheme from "@utils/hooks/useTheme";

import Layout from "@components/Layout";
import MessageList from "@components/Message/List";
import MessageOverview from "@components/Message/Overview";

const Index = () => {
	const theme = useTheme();

	return (
		<Layout>
			<Grid container spacing={0}>
				<Grid
					item
					xs={4}
					sx={{
						px: 3,
						borderRight: `${theme.palette.divider} 1px solid`
					}}
				>
					<MessageList />
				</Grid>
				<Grid item xs={8} sx={{ px: 3, py: 1 }}>
					<MessageOverview />
				</Grid>
			</Grid>
		</Layout>
	);
};

export default Index;

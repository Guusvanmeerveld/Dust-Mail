import { FC, memo } from "react";
import ReactMarkdown from "react-markdown";
import { useQuery } from "react-query";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";

import modalStyles from "@styles/modal";

import useApiClient from "@utils/hooks/useApiClient";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";
import { createResultFromUnknown, errorToString } from "@utils/parseError";

const UnMemoizedChangelog: FC = () => {
	const theme = useTheme();

	const showChangelog = useStore((state) => state.showChangelog);
	const setShowChangelog = useStore((state) => state.setShowChangelog);

	const apiClient = useApiClient();

	const { data, error, isFetching } = useQuery<string, string>(
		["changelog"],
		async () => {
			const result = await apiClient
				.getChangelog()
				.catch(createResultFromUnknown);

			if (result.ok) {
				return result.data;
			} else {
				throw errorToString(result.error);
			}
		},
		{ enabled: showChangelog }
	);

	return (
		<Modal onClose={() => setShowChangelog(false)} open={showChangelog}>
			<Box
				sx={{ ...modalStyles(theme), maxHeight: "75vh", overflowY: "scroll" }}
			>
				<Typography variant="h4">Changelog</Typography>
				{error !== null && <Typography>{error}</Typography>}
				{isFetching && <CircularProgress />}
				{data && <ReactMarkdown>{data}</ReactMarkdown>}
			</Box>
		</Modal>
	);
};

const Changelog = memo(UnMemoizedChangelog);

export default Changelog;

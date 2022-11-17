import { FC, memo } from "react";
import ReactMarkdown from "react-markdown";
import { useQuery } from "react-query";

import { AxiosError } from "axios";

import { PackageError } from "@dust-mail/typings";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";

import modalStyles from "@styles/modal";

import useHttpClient from "@utils/hooks/useFetch";
import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

const UnMemoizedChangelog: FC = () => {
	const theme = useTheme();

	const showChangelog = useStore((state) => state.showChangelog);
	const setShowChangelog = useStore((state) => state.setShowChangelog);

	const fetcher = useHttpClient();

	const { data, error, isFetching } = useQuery<
		string,
		AxiosError<PackageError>
	>(["changelog"], () => fetcher.getChangelog(), { enabled: showChangelog });

	return (
		<Modal onClose={() => setShowChangelog(false)} open={showChangelog}>
			<Box
				sx={{ ...modalStyles(theme), maxHeight: "75vh", overflowY: "scroll" }}
			>
				<Typography variant="h4">Changelog</Typography>
				{error && error.response?.data.message && (
					<Typography>{error.response.data.message}</Typography>
				)}
				{isFetching && <CircularProgress />}
				{data && <ReactMarkdown>{data}</ReactMarkdown>}
			</Box>
		</Modal>
	);
};

const Changelog = memo(UnMemoizedChangelog);

export default Changelog;

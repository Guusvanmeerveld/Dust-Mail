import { useInfiniteQuery } from "react-query";
import useLocalStorageState from "use-local-storage-state";

import axios from "axios";

import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";

import { BasicMessage } from "@interfaces/message";

import Layout from "@components/Layout";
import Loading from "@components/Loading";

const Index = () => {
	const [customServerUrl] = useLocalStorageState("customServerUrl");
	const [jwtToken] = useLocalStorageState("jwtToken");

	// The amount of messages to load per request
	const messageCountForPage = 10;

	// Request the messages using react-query
	const {
		data,
		error,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage
	} = useInfiniteQuery<BasicMessage[]>(
		"mails",
		({ pageParam = 0 }) => {
			if (pageParam === false) {
				return [];
			}

			return axios
				.get(`${customServerUrl}/mail`, {
					headers: { Authorization: `Bearer ${jwtToken}` },
					params: {
						cursor: pageParam,
						limit: messageCountForPage
					}
				})
				.then(({ data }) => data);
		},
		{
			getNextPageParam: (lastPage, pages) => {
				const morePagesExist = lastPage?.length === messageCountForPage;

				if (!morePagesExist) return false;

				return pages.length;
			}
		}
	);

	return (
		<Layout>
			{(isFetching || isFetchingNextPage) && <Loading />}
			{data &&
				data.pages &&
				data.pages.map((messages) =>
					messages.map((message) => {
						return (
							<Card
								sx={{ mx: 3, my: 1, p: 1 }}
								key={message.headers["message-id"]}
							>
								<Avatar alt={message.headers.from[0]} src="/broken-image.jpg" />
								{message.headers.subject} - {message.headers.from}
							</Card>
						);
					})
				)}
			<Button onClick={() => fetchNextPage()}>Next</Button>
		</Layout>
	);
};

export default Index;

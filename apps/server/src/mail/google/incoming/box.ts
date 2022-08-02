import { Box } from "@mail/interfaces/client/incoming.interface";

import GoogleBox from "../interfaces/box";

import axios from "axios";

import { IncomingMessage } from "@dust-mail/typings/message";

export const getBoxes = async (
	authorization: string
): Promise<{ name: string; id: string }[]> => {
	const { data } = await axios.get<{ labels: GoogleBox[] }>(
		"https://gmail.googleapis.com/gmail/v1/users/me/labels",
		{
			headers: {
				Authorization: authorization
			}
		}
	);

	return data.labels.map((box) => ({ name: box.name, id: box.id }));
};

export const getBox = async (
	authorization: string,
	boxID: string
): Promise<Box> => {
	const { data } = await axios.get<{ name: string; messagesTotal: number }>(
		`https://gmail.googleapis.com/gmail/v1/users/me/labels/${boxID}`,
		{
			headers: {
				Authorization: authorization
			}
		}
	);

	return { name: data.name, totalMessages: data.messagesTotal };
};

export const getBoxMessages = async (
	authorization: string,
	boxID: string,
	options: { start: number; end: number; nextPageToken?: string }
): Promise<[messages: IncomingMessage[], nextPageToken?: string]> => {
	const { data } = await axios.get<{
		messages: { id: string }[];
		nextPageToken?: string;
	}>(`https://gmail.googleapis.com/gmail/v1/users/me/messages`, {
		params: {
			maxResults: options.end + 1 - options.start,
			labelIds: boxID,
			pageToken: options.nextPageToken
		},
		headers: {
			Authorization: authorization
		}
	});

	return [
		await Promise.all(
			data.messages.map(async (message) => {
				const { data } = await axios.get<{
					internalDate: string;
					id: string;
					payload: { headers: [{ name: string; value: string }] };
				}>(
					`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
					{
						headers: {
							Authorization: authorization
						}
					}
				);

				const from = data.payload.headers
					.filter((header) => header.name === "From")
					.map((from) => ({ email: from?.value, displayName: "" }));

				return {
					date: new Date(parseInt(data.internalDate)),
					subject: data.payload.headers.find(
						(header) => header.name == "Subject"
					)?.value,
					from,
					id: data.id,
					flags: {
						seen: true
					}
				};
			})
		),
		data.nextPageToken
	];
};

import z from "zod";

import useMailClient from "./useMailClient";
import useUser from "./useUser";

import { useCallback } from "react";
import { useQuery } from "react-query";

import { Error } from "@models/error";
import { MailBox, MailBoxList } from "@models/mailbox";

import findBoxFromBoxes from "@utils/findBox";
import { createErrorFromUnknown, errorToString } from "@utils/parseError";

type UseBoxes = {
	boxes: z.infer<typeof MailBoxList> | void;
	error: string | void;
	findBox: (id: string) => z.infer<typeof MailBox> | void;
};

const useBoxes = (): UseBoxes => {
	const mailClient = useMailClient();

	const user = useUser();

	const { data: boxes, error } = useQuery<
		z.infer<typeof MailBoxList>,
		z.infer<typeof Error>
	>(["boxes", user?.username], () =>
		mailClient
			.list()
			.then((result) => {
				if (!result.ok) {
					throw result.error;
				} else {
					return result.data;
				}
			})
			.catch((error: unknown) => {
				throw createErrorFromUnknown(error);
			})
	);

	const findBox = useCallback(
		(id: string) => {
			if (!boxes) return;

			return findBoxFromBoxes(id, boxes);
		},
		[boxes]
	);

	return { boxes, error: error ? errorToString(error) : undefined, findBox };
};

export default useBoxes;

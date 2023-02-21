import z from "zod";

import useMailClient from "./useMailClient";
import useUser from "./useUser";

import { useCallback } from "react";
import { useQuery } from "react-query";

import { Error } from "@models/error";
import { MailBox, MailBoxList } from "@models/mailbox";

import findBoxFromBoxes from "@utils/findBox";
import {
	createBaseError,
	createErrorFromUnknown,
	errorToString
} from "@utils/parseError";

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
	>(["boxes", user?.id], async () => {
		const result = await mailClient
			.list()
			.catch((error: unknown) =>
				createBaseError(createErrorFromUnknown(error))
			);

		if (result.ok) {
			return result.data;
		} else {
			throw result.error;
		}
	});

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

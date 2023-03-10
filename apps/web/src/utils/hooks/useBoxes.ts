import useMailClient from "./useMailClient";
import useUser from "./useUser";

import { useCallback } from "react";
import { useQuery } from "react-query";

import { MailBox, MailBoxList, AppError } from "@dust-mail/structures";

import findBoxFromBoxes from "@utils/findBox";
import { createResultFromUnknown, errorToString } from "@utils/parseError";

type UseBoxes = {
	boxes: MailBoxList | void;
	error: string | null;
	findBox: (id: string) => MailBox | void;
};

const useBoxes = (): UseBoxes => {
	const mailClient = useMailClient();

	const user = useUser();

	const { data: boxes, error } = useQuery<MailBoxList, AppError>(
		["boxes", user?.id],
		async () => {
			const result = await mailClient.list().catch(createResultFromUnknown);

			if (result.ok) {
				return result.data;
			} else {
				throw result.error;
			}
		}
	);

	const findBox = useCallback(
		(id: string) => {
			if (!boxes) return;

			return findBoxFromBoxes(id, boxes);
		},
		[boxes]
	);

	return { boxes, error: error ? errorToString(error) : null, findBox };
};

export default useBoxes;

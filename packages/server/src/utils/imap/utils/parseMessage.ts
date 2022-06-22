import { ParsedMail } from "mailparser";

import createGravatarUrl from "@utils/createGravatarUrl";

const parseMessage = (
	result: ParsedMail
): {
	subject?: string;
	id: string;
	from: { displayName: string; email: string; avatar: string }[];
} => ({
	from: result.from.value.map(createAddress),
	subject: result.subject,
	id: result.messageId
});

export const createAddress = (from: { name: string; address: string }) => {
	const { name, address } = from;

	const avatar = createGravatarUrl(address);

	return { avatar, email: address, displayName: name };
};

export default parseMessage;

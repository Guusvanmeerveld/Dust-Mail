import { ParsedMail } from "mailparser";

import { Address } from "@utils/interfaces/message";

const parseMessage = (
	result: ParsedMail
): {
	subject?: string;
	id: string;
	from: Address[];
} => ({
	from: result.from.value.map(createAddress),
	subject: result.subject,
	id: result.messageId
});

export const createAddress = (from: { name: string; address: string }) => {
	const { name, address } = from;

	return { email: address, displayName: name };
};

export default parseMessage;

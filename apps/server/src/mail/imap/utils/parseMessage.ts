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

export const createAddress = ({
	name,
	address
}: {
	name: string;
	address?: string;
}): Address => ({ email: address, displayName: name });

export default parseMessage;

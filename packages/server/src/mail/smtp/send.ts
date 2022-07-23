import { Transporter } from "nodemailer";

import { Address, OutgoingMessage } from "@utils/interfaces/message";

const send = async (
	_client: Transporter,
	message: OutgoingMessage
): Promise<void> => {
	await _client.sendMail({
		from: convertAddress(message.from),
		to: handleAddress(message.to),
		cc: handleAddress(message.cc),
		bcc: handleAddress(message.bcc),
		subject: message.subject,
		html: message.content,
		inReplyTo: message.inReplyTo,
		replyTo: convertAddress(message.replyTo)
	});
};

const handleAddress = (address: Address | Address[]) =>
	Array.isArray(address)
		? address.map(convertAddress)
		: convertAddress(address);

const convertAddress = (address?: Address) => {
	if (!address) return;

	return {
		name: address.displayName,
		address: address.email
	};
};

export default send;

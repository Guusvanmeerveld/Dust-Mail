import { Message } from "@dust-mail/structures";

export default interface MessageAction {
	name: string;
	icon: JSX.Element;
	handler: (message: Message) => void;
}

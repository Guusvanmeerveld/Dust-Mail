import { IncomingMessage } from "@dust-mail/typings";

export default interface MessageAction {
	name: string;
	icon: JSX.Element;
	handler: (message: IncomingMessage) => void;
}

import z from "zod";

import { Message } from "@models/message";

export default interface MessageAction {
	name: string;
	icon: JSX.Element;
	handler: (message: z.infer<typeof Message>) => void;
}

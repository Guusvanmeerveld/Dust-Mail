import { ServerType } from "@dust-mail/structures";

export default interface User {
	id: string;
	usernames: Record<ServerType, string>;
	token: string;
}

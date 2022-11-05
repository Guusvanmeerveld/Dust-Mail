import Box from "./box";

import { LocalToken } from "@dust-mail/typings";

export interface NewUser extends Omit<User, "boxes"> {
	/**
	 * flattened boxes
	 */
	boxes: Box[];
}

export default interface User {
	username: string;
	boxes: {
		nested: Box[];
		flattened: Box[];
	};
	accessToken: LocalToken;
	refreshToken: LocalToken;
}

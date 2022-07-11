import Server from "@auth/interfaces/server.interface";

import { createHash } from "@utils/createHash";

export const createIdentifier = (config: Server): string =>
	createHash(
		`${config.username}:${config.password}@${config.server}:${config.port}`
	);

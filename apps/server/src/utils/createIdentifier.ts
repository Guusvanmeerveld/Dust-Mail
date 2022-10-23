import { createHash } from "@utils/createHash";

import Config from "@auth/interfaces/config.interface";

export const createIdentifier = (config: Config): string =>
	createHash(
		`${config.username}:${config.password}@${config.server}:${config.port}`,
		"sha512"
	);

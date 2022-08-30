import Config from "@auth/interfaces/config.interface";

import { createHash } from "@utils/createHash";

export function createIdentifier(config: Config): string {
	return createHash(
		`${config.username}:${config.password}@${config.server}:${config.port}`,
		"sha256"
	);
}

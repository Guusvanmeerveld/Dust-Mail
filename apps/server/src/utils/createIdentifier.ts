import { createHash } from "@utils/createHash";

import Config from "@auth/interfaces/config.interface";

export function createIdentifier(config: Config): string {
	return createHash(
		`${config.username}:${config.password}@${config.server}:${config.port}`,
		"sha256"
	);
}

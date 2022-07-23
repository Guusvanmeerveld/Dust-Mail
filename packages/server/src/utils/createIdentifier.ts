import Config from "@auth/interfaces/config.interface";

import { createHash } from "@utils/createHash";

export function createIdentifier(config: Config): string {
	if (config.mail)
		return createHash(
			`${config.mail.username}:${config.mail.password}@${config.mail.server}:${config.mail.port}`,
			"sha256"
		);

	if (config.google)
		return createHash(`google-oauth-${config.google.userID}`, "sha256");
}

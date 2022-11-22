import { createHash } from "@utils/createHash";

import { LoginConfig } from "@auth/interfaces/jwt.interface";

export const createIdentifier = (config: LoginConfig): string => {
	switch (config.configType) {
		case "basic":
			const incoming = config.incoming;

			return createHash(
				`${incoming.username}${
					config.oauth ? `:${config.oauth.user.id}` : ""
				}@${incoming.server}:${incoming.port}`,
				"sha512"
			);
	}
};

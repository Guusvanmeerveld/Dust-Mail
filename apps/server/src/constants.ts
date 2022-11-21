import { ensureFile, readFile, writeFile } from "fs-extra";
import { join } from "path";

import generateRandomPassword from "@utils/createPassword";

export const getPort = () => parseInt(process.env.PORT) || 3000;

export const getUnixSocketPath = () => process.env.UNIX_SOCKET_PATH;

export const getBasePath = () => process.env.BASE_PATH ?? "";

export const bearerPrefix = "Bearer ";

export const getSecretsDir = () =>
	process.env.SECRETS_DIR ?? join(process.cwd(), "secrets");

export const jwtConstants = {
	getSecret: async () => {
		if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

		const jwtSecretLocation = join(getSecretsDir(), "jwt");

		await ensureFile(jwtSecretLocation);

		const contents = await readFile(jwtSecretLocation).then((data) =>
			data.length != 0 ? data.toString("utf-8") : false
		);

		if (contents) return contents;
		else {
			const password = await generateRandomPassword();

			await writeFile(jwtSecretLocation, password);

			return password;
		}
	},
	/**
	 * Expiry time in seconds
	 */
	getRefreshTokenExpires: () =>
		parseInt(process.env.SESSION_EXPIRES) || 60 * 60 * 24 * 7,
	accessTokenExpires: 60 * 15
};

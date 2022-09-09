import { ensureFile, readFile, readFileSync, writeFile } from "fs-extra";
import { join } from "path";

import generateRandomPassword from "@utils/createPassword";

export const getPort = () => parseInt(process.env.PORT) || 3000;

export const getBasePath = () => process.env.BASE_PATH;

const getJwtSecretLocation = () =>
	process.env.JWT_SECRET_LOCATION ?? join(process.cwd(), "secret");

export const jwtConstants = {
	getSecret: async () => {
		if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

		const jwtSecretLocation = getJwtSecretLocation();

		await ensureFile(jwtSecretLocation);

		const contents = await readFile(jwtSecretLocation).then((data) =>
			data.length != 0 ? data.toString("utf-8") : false
		);

		if (contents) return contents;
		else {
			const password = generateRandomPassword();

			await writeFile(jwtSecretLocation, password);

			return password;
		}
	},
	getSecretSync: () => {
		if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

		return readFileSync(getJwtSecretLocation());
	},
	/**
	 * Expiry time in seconds
	 */
	getRefreshTokenExpires: () =>
		parseInt(process.env.SESSION_EXPIRES) || 60 * 60 * 24 * 7,
	accessTokenExpires: 60 * 15
};

export const getPort = () => parseInt(process.env.PORT) || 3000;

export const jwtConstants = {
	getSecret: () => process.env.JWT_SECRET ?? "change_me",
	/**
	 * Expiry time in seconds
	 */
	getRefreshTokenExpires: () =>
		parseInt(process.env.SESSION_EXPIRES) || 60 * 60 * 24 * 7,
	accessTokenExpires: 60 * 15
};

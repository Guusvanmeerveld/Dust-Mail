export const jwtConstants = {
	secret: process.env.JWT_SECRET ?? "change_me",
	/**
	 * Expiry time in seconds
	 */
	refreshTokenExpires:
		parseInt(process.env.SESSION_EXPIRES) || 60 * 60 * 24 * 7,
	accessTokenExpires: 60 * 15
};

export const allowedDomains = process.env.ALLOWED_DOMAINS;

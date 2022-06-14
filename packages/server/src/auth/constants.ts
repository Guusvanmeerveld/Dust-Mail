export const jwtConstants = {
	secret: process.env.JWT_SECRET ?? "change_me",
	/**
	 * Expiry time in seconds
	 */
	expires: parseInt(process.env.JWT_EXPIRES) || 3600
};

export const allowedDomains = process.env.ALLOWED_DOMAINS;

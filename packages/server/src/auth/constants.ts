export const jwtConstants = {
	secret: process.env.JWT_SECRET ?? "change_me"
};

/**
 * Expiry time in seconds
 */
export const jwtExpiry = 600;

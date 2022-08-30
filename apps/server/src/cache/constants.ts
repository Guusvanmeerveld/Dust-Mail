import { join } from "path";

export const getRedisUri = () => process.env.REDIS_URL;

export const getJsonCacheDir = () =>
	process.env.CACHE_DIR ?? join(process.cwd(), "cache");

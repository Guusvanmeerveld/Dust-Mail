import { redisUri } from "./constants";
import JSONCacheService from "./json";
import RedisCacheService from "./redis";

export const CacheService = redisUri ? RedisCacheService : JSONCacheService;

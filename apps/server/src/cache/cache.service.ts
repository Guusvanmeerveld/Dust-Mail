import fs from "fs-extra";
import { join } from "path";
import { createClient, RedisClientType } from "redis";

import { getCacheTimeout, getJsonCacheDir, getRedisUri } from "./constants";
import Cache, { getter, initter, setter, writer } from "./interfaces/cache";

import { Injectable } from "@nestjs/common";

const getCacheFile = () => join(getJsonCacheDir(), "cache.json");

@Injectable()
export class CacheService implements Cache {
	private readonly cacheFile: string;

	private readonly redisClient: RedisClientType;

	private readonly isRedisCache: boolean;

	private readonly cacheTimeout: number;

	private data: Record<string, any>;

	constructor() {
		this.cacheTimeout = getCacheTimeout();

		this.isRedisCache = !!getRedisUri();

		if (this.isRedisCache)
			this.redisClient = createClient({ url: getRedisUri() });
		else this.cacheFile = getCacheFile();
	}

	public init: initter = async () => {
		if (this.isRedisCache) {
			await this.redisClient.connect();
		} else {
			await fs.ensureFile(this.cacheFile);

			if (
				await fs
					.readJSON(this.cacheFile)
					.then((currentCache) => {
						this.data = currentCache;

						return false;
					})
					.catch(() => {
						this.data = {};

						return true;
					})
			)
				await fs.outputJSON(this.cacheFile, {});
		}
	};

	// public get: getter = async (path: string[]) => {
	// 	return {};
	// };

	// public set: setter = async (path: string[], value: string) => {};

	public write: writer = async () => {
		if (this.isRedisCache) {
		} else {
			await fs.outputJSON(this.cacheFile, this.data);
		}
	};
}

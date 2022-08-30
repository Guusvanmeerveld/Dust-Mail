import { Injectable } from "@nestjs/common";

import { createClient, RedisClientType } from "redis";

import fs from "fs-extra";

import { join } from "path";

import Cache, { getter, initter, setter, writer } from "./interfaces/cache";

import { getJsonCacheDir, getRedisUri } from "./constants";

const getCacheFile = () => join(getJsonCacheDir(), "cache.json");

@Injectable()
export class CacheService implements Cache {
	private readonly cacheFile: string;

	private readonly redisClient: RedisClientType;

	private readonly isRedisCache: boolean;

	private inMemoryCache: Record<string, any>;

	constructor() {
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
						this.inMemoryCache = currentCache;

						return false;
					})
					.catch(() => {
						this.inMemoryCache = {};

						return true;
					})
			)
				await fs.outputJSON(this.cacheFile, {});
		}
	};

	public get: getter = <T>(key: string[]) => {
		let path = this.inMemoryCache;

		for (let i = 0; i < key.length; i++) {
			path = this.inMemoryCache[key[i]];
		}

		return path as T;
	};

	public set: setter = async (key: string[], value: string) => {
		let path = this.inMemoryCache;

		for (let i = 0; i < key.length - 1; i++) {
			path = this.inMemoryCache[key[i]];
		}
	};

	public write: writer = async () => {
		if (this.isRedisCache) {
		} else {
			await fs.outputJSON(this.cacheFile, this.inMemoryCache);
		}
	};
}

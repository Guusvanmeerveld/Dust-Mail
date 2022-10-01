import fs from "fs-extra";
import { join } from "path";

import { getCacheTimeout, getJsonCacheDir, getRedisUri } from "./constants";
import Cache, { getter, initter, setter } from "./interfaces/cache";

import { createClient, RedisClientType } from "redis";

import { Injectable } from "@nestjs/common";

const getCacheFile = () => join(getJsonCacheDir(), "cache.json");

@Injectable()
export class CacheService implements Cache {
	private readonly cacheFile: string;

	private readonly redisClient: RedisClientType;

	private readonly isRedisCache: boolean;

	private readonly cacheTimeout: number;

	constructor() {
		this.cacheTimeout = getCacheTimeout();

		this.isRedisCache = !!getRedisUri();

		if (this.isRedisCache)
			this.redisClient = createClient({ url: getRedisUri() });
		else this.cacheFile = getCacheFile();
	}

	private createKey = (path: string[]) =>
		Buffer.from(path.join("."), "utf-8").toString("base64");

	public init: initter = async () => {
		if (this.isRedisCache) {
			await this.redisClient.connect();
		} else {
			await fs.ensureFile(this.cacheFile);

			if (
				await fs
					.readJSON(this.cacheFile)
					.then(() => {
						return false;
					})
					.catch(() => {
						return true;
					})
			)
				await fs.outputJSON(this.cacheFile, {});
		}
	};

	public get: getter = async <T>(path: string[]): Promise<T | undefined> => {
		const key = this.createKey(path);

		if (this.isRedisCache) {
			const data = await this.redisClient.get(key);

			if (data) return JSON.parse(data) as T;
		} else {
			const data = await fs.readJSON(this.cacheFile);

			const value = data[key];

			return value;
		}
	};

	public set: setter = async <T>(path: string[], value: T): Promise<void> => {
		const key = this.createKey(path);

		if (this.isRedisCache) {
			await this.redisClient.set(key, JSON.stringify(value));

			await this.redisClient.expire(key, this.cacheTimeout / 1000);
		} else {
			const data = await fs.readJSON(this.cacheFile);

			const value = data[key];

			return value;
		}
	};
}

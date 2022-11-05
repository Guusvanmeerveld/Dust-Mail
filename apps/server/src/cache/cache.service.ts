import fs from "fs-extra";
import { join } from "path";

import { getCacheTimeout, getJsonCacheDir, getRedisUri } from "./constants";
import Cache, { getter, initter, setter } from "./interfaces/cache";

import { createClient, RedisClientType } from "redis";

import { Injectable } from "@nestjs/common";

import { createHash } from "@src/utils/createHash";
import createIdentifierFromEnvironment from "@src/utils/createIdentifierFromEnvironment";

const getCacheFile = (identifier: string) =>
	join(getJsonCacheDir(), identifier + ".json");

interface CacheItem {
	expires: number;
	data: any;
}

@Injectable()
export class CacheService implements Cache {
	private cacheFile = "";

	private readonly redisClient: RedisClientType;

	private readonly isRedisCache: boolean;

	private readonly cacheTimeout: number;

	private data: Record<string, CacheItem> = {};

	constructor() {
		this.cacheTimeout = getCacheTimeout();

		this.isRedisCache = !!getRedisUri();

		if (this.isRedisCache)
			this.redisClient = createClient({ url: getRedisUri() });
	}

	private createKey = (path: string[]) => createHash(path.join("."), "sha256");

	public init: initter = async () => {
		const identifier = await createIdentifierFromEnvironment();

		if (this.isRedisCache) {
			await this.redisClient.connect();

			const response = (await this.redisClient.json.get(identifier, {
				path: "$"
			})) as Array<any>;

			if (response) this.data = response.shift();
			else this.data = {};
		} else {
			this.cacheFile = getCacheFile(identifier);

			await fs.ensureFile(this.cacheFile);

			if (
				await fs
					.readJSON(this.cacheFile)
					.then((data) => {
						this.data = data;
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

	public get: getter = async <T>(path: string[]): Promise<T | undefined> => {
		const key = this.createKey(path);

		const item = this.data[key];

		if (item?.expires) {
			if (item.expires > Date.now()) return item.data;
			else this.cleanUp();
		}
	};

	private cleanUp = () => {
		const expired = Object.entries(this.data).filter(([, item]) => {
			return item.expires < Date.now();
		});

		expired.forEach(([id]) => {
			delete this.data[id];
		});
	};

	public set: setter = async <T>(path: string[], value: T): Promise<void> => {
		const key = this.createKey(path);

		this.data = {
			...this.data,
			[key]: { data: value, expires: Date.now() + this.cacheTimeout }
		};

		await this.write();
	};

	private write = async (): Promise<void> => {
		if (this.isRedisCache) {
			const identifier = await createIdentifierFromEnvironment();

			await this.redisClient.json.set(
				identifier,
				"$",
				this.data as Record<string, any>
			);
		} else await fs.writeJSON(this.cacheFile, this.data);
	};
}

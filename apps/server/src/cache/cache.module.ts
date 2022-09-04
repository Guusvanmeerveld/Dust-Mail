import { CacheService } from "./cache.service";

import { Module } from "@nestjs/common";

@Module({
	providers: [
		{
			provide: "CACHE",
			useFactory: async () => {
				const service = new CacheService();

				await service.init();

				return service;
			}
		}
	],
	exports: ["CACHE"]
})
export class CacheModule {}

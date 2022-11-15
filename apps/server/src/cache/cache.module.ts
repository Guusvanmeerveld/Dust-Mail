import { CacheService } from "./cache.service";

import { Module } from "@nestjs/common";

import { CryptoModule } from "@src/crypto/crypto.module";

@Module({
	imports: [CryptoModule],
	providers: [CacheService],
	exports: [CacheService]
})
export class CacheModule {}

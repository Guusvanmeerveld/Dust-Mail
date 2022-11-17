import { GoogleController } from "./google.controller";
import { GoogleService } from "./google.service";

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { jwtConstants } from "@src/constants";
import { CryptoModule } from "@src/crypto/crypto.module";

import { CacheModule } from "@cache/cache.module";

@Module({
	imports: [
		JwtModule.registerAsync({
			useFactory: async () => ({
				secret: await jwtConstants.getSecret(),
				signOptions: { expiresIn: jwtConstants.getRefreshTokenExpires() }
			})
		}),
		CryptoModule,
		CacheModule
	],
	providers: [GoogleService],
	exports: [GoogleService],
	controllers: [GoogleController]
})
export class GoogleModule {}

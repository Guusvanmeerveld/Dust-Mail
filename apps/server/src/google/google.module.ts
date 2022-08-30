import { Module } from "@nestjs/common";

import { JwtModule } from "@nestjs/jwt";

import { CacheModule } from "@cache/cache.module";

import { jwtConstants } from "@src/constants";

import { GoogleService } from "./google.service";
import { GoogleController } from "./google.controller";

@Module({
	imports: [
		JwtModule.register({
			secret: jwtConstants.getSecret(),
			signOptions: { expiresIn: jwtConstants.getRefreshTokenExpires() }
		}),
		CacheModule
	],
	providers: [GoogleService],
	exports: [GoogleService],
	controllers: [GoogleController]
})
export class GoogleModule {}

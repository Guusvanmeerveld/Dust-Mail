import { CacheModule } from "@cache/cache.module";

import { GoogleController } from "./google.controller";
import { GoogleService } from "./google.service";

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { jwtConstants } from "@src/constants";

@Module({
	imports: [
		JwtModule.registerAsync({
			useFactory: async () => ({
				secret: await jwtConstants.getSecret(),
				signOptions: { expiresIn: jwtConstants.getRefreshTokenExpires() }
			})
		}),
		CacheModule
	],
	providers: [GoogleService],
	exports: [GoogleService],
	controllers: [GoogleController]
})
export class GoogleModule {}

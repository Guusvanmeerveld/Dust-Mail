import { GoogleController } from "./google.controller";
import { GoogleService } from "./google.service";

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";

import { jwtConstants } from "@src/constants";
import { CryptoModule } from "@src/crypto/crypto.module";

@Module({
	imports: [
		JwtModule.registerAsync({
			useFactory: async () => ({
				secret: await jwtConstants.getSecret(),
				signOptions: { expiresIn: jwtConstants.getRefreshTokenExpires() }
			})
		}),
		ThrottlerModule.forRoot({
			ttl: 60,
			limit: 5
		}),
		CryptoModule
	],
	providers: [GoogleService],
	exports: [GoogleService],
	controllers: [GoogleController]
})
export class GoogleModule {}

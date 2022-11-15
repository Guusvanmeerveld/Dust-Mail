import { MailController } from "./mail.controller";
import { MailService } from "./mail.service";

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";

import { jwtConstants } from "@src/constants";
import { CryptoModule } from "@src/crypto/crypto.module";

import { AuthModule } from "@auth/auth.module";

@Module({
	imports: [
		JwtModule.registerAsync({
			useFactory: async () => ({
				secret: await jwtConstants.getSecret(),
				signOptions: { expiresIn: jwtConstants.accessTokenExpires }
			})
		}),
		ThrottlerModule.forRoot({
			ttl: 60,
			limit: 60
		}),
		CryptoModule,
		AuthModule
	],
	controllers: [MailController],
	providers: [MailService]
})
export class MailModule {}

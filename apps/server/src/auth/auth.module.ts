import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";

import { jwtConstants } from "@src/constants";
import { CryptoModule } from "@src/crypto/crypto.module";
import { GoogleModule } from "@src/google/google.module";
import { ImapModule } from "@src/imap/imap.module";
import { SmtpModule } from "@src/smtp/smtp.module";

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
		CryptoModule,
		GoogleModule,
		ImapModule,
		SmtpModule
	],
	providers: [AuthService, JwtStrategy],
	exports: [AuthService],
	controllers: [AuthController]
})
export class AuthModule {}

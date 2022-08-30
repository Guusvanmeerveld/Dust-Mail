import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";

import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { AuthController } from "./auth.controller";

import { GoogleModule } from "@src/google/google.module";
import { ImapModule } from "@src/imap/imap.module";
import { SmtpModule } from "@src/smtp/smtp.module";

import { jwtConstants } from "@src/constants";

@Module({
	imports: [
		JwtModule.register({
			secret: jwtConstants.getSecret(),
			signOptions: { expiresIn: jwtConstants.getRefreshTokenExpires() }
		}),
		ThrottlerModule.forRoot({
			ttl: 60,
			limit: 5
		}),
		GoogleModule,
		ImapModule,
		SmtpModule
	],
	providers: [AuthService, JwtStrategy],
	exports: [AuthService],
	controllers: [AuthController]
})
export class AuthModule {}

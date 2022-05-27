import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { AuthController } from "./auth.controller";

import { jwtConstants, jwtExpiry } from "./constants";

@Module({
	imports: [
		JwtModule.register({
			secret: jwtConstants.secret,
			signOptions: { expiresIn: `${jwtExpiry}s` }
		})
	],
	providers: [AuthService, JwtStrategy],
	exports: [AuthService],
	controllers: [AuthController]
})
export class AuthModule {}
